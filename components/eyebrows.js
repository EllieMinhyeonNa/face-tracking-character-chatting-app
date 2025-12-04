// Eyebrows component - handles eyebrow tracking and rendering

function drawEyebrows(face, distanceScale = 1, eyeScale = 1) {
  // Use eye scale for size variation (matches eye size changes)
  // Use distance scale for stroke weight only
  let strokeScale = constrain(distanceScale, CONFIG.eyebrows.minScale, CONFIG.eyebrows.maxScale);

  // Left eyebrow - top and bottom rows
  let leftBrowTop = [70, 63, 105, 66, 107];
  let leftBrowBottom = [46, 53, 52, 65, 55];

  // Right eyebrow - top and bottom rows
  let rightBrowTop = [300, 293, 334, 296, 336];
  let rightBrowBottom = [276, 283, 282, 295, 285];

  // Draw left eyebrow
  drawEyebrow(face, leftBrowTop, leftBrowBottom, strokeScale, eyeScale);

  // Draw right eyebrow
  drawEyebrow(face, rightBrowTop, rightBrowBottom, strokeScale, eyeScale);
}

function drawEyebrow(face, topPoints, bottomPoints, strokeScale = 1, eyeScale = 1) {
  // Calculate the original center point of the eyebrow
  let originalCenterX = 0;
  let originalCenterY = 0;
  let pointCount = 0;

  for (let i = 0; i < topPoints.length; i++) {
    let topPoint = face.keypoints[topPoints[i]];
    let bottomPoint = face.keypoints[bottomPoints[i]];
    originalCenterX += (topPoint.x + bottomPoint.x) / 2;
    originalCenterY += (topPoint.y + bottomPoint.y) / 2;
    pointCount++;
  }
  originalCenterX /= pointCount;
  originalCenterY /= pointCount;

  // Calculate face center (nose bridge area)
  let noseBridge = face.keypoints[6];
  let faceCenterX = noseBridge.x;
  let faceCenterY = noseBridge.y;

  // Optional: Mark the keypoints with RED circles for debugging
  if (CONFIG.eyebrows.showDebugPoints) {
    for (let idx of topPoints) {
      let point = face.keypoints[idx];
      fill(255, 0, 0, 150);
      noStroke();
      circle(point.x, point.y, 8);
    }
    for (let idx of bottomPoints) {
      let point = face.keypoints[idx];
      fill(255, 0, 0, 150);
      noStroke();
      circle(point.x, point.y, 8);
    }
  }

  // Draw the eyebrow curve through the center of top and bottom points
  noFill();
  stroke(...CONFIG.eyebrows.color);
  strokeWeight(CONFIG.eyebrows.strokeWeight * CONFIG.eyebrows.exaggerationFactor * strokeScale);
  strokeCap(ROUND);

  beginShape();

  // Calculate center points between top and bottom rows with exaggeration
  for (let i = 0; i < topPoints.length; i++) {
    let topPoint = face.keypoints[topPoints[i]];
    let bottomPoint = face.keypoints[bottomPoints[i]];

    // Center point between top and bottom
    let centerX = (topPoint.x + bottomPoint.x) / 2;
    let centerY = (topPoint.y + bottomPoint.y) / 2;

    // Calculate offset from face center
    let offsetX = centerX - faceCenterX;
    let offsetY = centerY - faceCenterY;

    // Apply exaggeration and eye scale to the offset
    let exaggeratedX = faceCenterX + (offsetX * CONFIG.eyebrows.exaggerationFactor * eyeScale);
    let exaggeratedY = faceCenterY + (offsetY * CONFIG.eyebrows.exaggerationFactor * eyeScale) + CONFIG.eyebrows.verticalOffset;

    curveVertex(exaggeratedX, exaggeratedY);
  }

  // Add extra point at the end for smooth curve
  let lastTop = face.keypoints[topPoints[topPoints.length - 1]];
  let lastBottom = face.keypoints[bottomPoints[bottomPoints.length - 1]];
  let lastCenterX = (lastTop.x + lastBottom.x) / 2;
  let lastCenterY = (lastTop.y + lastBottom.y) / 2;

  // Apply exaggeration and eye scale to last point
  let lastOffsetX = lastCenterX - faceCenterX;
  let lastOffsetY = lastCenterY - faceCenterY;
  let lastExaggeratedX = faceCenterX + (lastOffsetX * CONFIG.eyebrows.exaggerationFactor * eyeScale);
  let lastExaggeratedY = faceCenterY + (lastOffsetY * CONFIG.eyebrows.exaggerationFactor * eyeScale) + CONFIG.eyebrows.verticalOffset;

  curveVertex(lastExaggeratedX, lastExaggeratedY);

  endShape();
}
