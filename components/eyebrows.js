// Eyebrows component - handles eyebrow tracking and rendering

function drawEyebrows(face, distanceScale = 1.0, eyeScale = 1) {
  // Use eye scale for size variation (matches eye size changes)
  // Use distance scale for stroke weight only
  let strokeScale = constrain(distanceScale, CONFIG.eyebrows.minScale, CONFIG.eyebrows.maxScale);

  // Eyebrow keypoint arrays from constants
  let leftBrowTop = KEYPOINTS.EYEBROW_LEFT_TOP_ROW;
  let leftBrowBottom = KEYPOINTS.EYEBROW_LEFT_BOTTOM_ROW;
  let rightBrowTop = KEYPOINTS.EYEBROW_RIGHT_TOP_ROW;
  let rightBrowBottom = KEYPOINTS.EYEBROW_RIGHT_BOTTOM_ROW;

  // === STEP 1: DETECT EYEBROW RAISING ===
  // Measure distance from eyebrow center to eye center (on same side)
  // When you raise eyebrows, they move away from eyes
  // This is rotation-invariant and head-tilt resistant

  // Calculate left eyebrow center
  let leftBrowCenterX = 0;
  let leftBrowCenterY = 0;
  for (let i = 0; i < leftBrowTop.length; i++) {
    let topPoint = face.keypoints[leftBrowTop[i]];
    let bottomPoint = face.keypoints[leftBrowBottom[i]];
    leftBrowCenterX += (topPoint.x + bottomPoint.x) / 2;
    leftBrowCenterY += (topPoint.y + bottomPoint.y) / 2;
  }
  leftBrowCenterX /= leftBrowTop.length;
  leftBrowCenterY /= leftBrowTop.length;

  // Calculate right eyebrow center
  let rightBrowCenterX = 0;
  let rightBrowCenterY = 0;
  for (let i = 0; i < rightBrowTop.length; i++) {
    let topPoint = face.keypoints[rightBrowTop[i]];
    let bottomPoint = face.keypoints[rightBrowBottom[i]];
    rightBrowCenterX += (topPoint.x + bottomPoint.x) / 2;
    rightBrowCenterY += (topPoint.y + bottomPoint.y) / 2;
  }
  rightBrowCenterX /= rightBrowTop.length;
  rightBrowCenterY /= rightBrowTop.length;

  // Get eye centers
  let leftEyeCenter = face.keypoints[KEYPOINTS.LEFT_PUPIL];
  let rightEyeCenter = face.keypoints[KEYPOINTS.RIGHT_PUPIL];

  // Measure distance from each eyebrow to its corresponding eye
  let leftBrowToEyeDist = dist(leftBrowCenterX, leftBrowCenterY, leftEyeCenter.x, leftEyeCenter.y);
  let rightBrowToEyeDist = dist(rightBrowCenterX, rightBrowCenterY, rightEyeCenter.x, rightEyeCenter.y);
  let avgBrowToEyeDist = (leftBrowToEyeDist + rightBrowToEyeDist) / 2;

  // Normalize by face size (eye-to-eye distance) to be camera-distance independent
  let eyeDistance = dist(leftEyeCenter.x, leftEyeCenter.y, rightEyeCenter.x, rightEyeCenter.y);

  // Calculate distance ratio (independent of camera distance AND head rotation)
  let distanceRatio = avgBrowToEyeDist / eyeDistance;

  // Map ratio to raise amount (adjust thresholds based on your face)
  // Typical values: neutral ~0.41, raised ~0.48
  let browRaiseAmount = constrain(map(distanceRatio, 0.41, 0.48, 0.0, 0.8), 0, 1);

  // DEBUG: Show distance ratio and raise amount to calibrate thresholds
  if (CONFIG.eyebrows.showDynamicsDebug) {
    push();
    fill(255, 255, 0);
    noStroke();
    textSize(14);
    textAlign(LEFT, TOP);
    text(`Brow-to-Eye Distance Ratio: ${distanceRatio.toFixed(3)}`, 10, 20);
    text(`Brow Raise Amount: ${(browRaiseAmount * 100).toFixed(1)}%`, 10, 40);
    text(`Height Multiplier: ${(1.0 + browRaiseAmount * 0.8).toFixed(2)}x`, 10, 60);
    pop();
  }

  // Draw left eyebrow with raise amount
  drawEyebrow(face, leftBrowTop, leftBrowBottom, strokeScale, eyeScale, browRaiseAmount);

  // Draw right eyebrow with raise amount
  drawEyebrow(face, rightBrowTop, rightBrowBottom, strokeScale, eyeScale, browRaiseAmount);
}

function drawEyebrow(face, topPoints, bottomPoints, strokeScale = 1, eyeScale = 1, browRaiseAmount = 0) {
  // Calculate face center (nose bridge area)
  let noseBridge = face.keypoints[KEYPOINTS.NOSE_BRIDGE];
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

    // === STEP 2: HEIGHT EXAGGERATION ===
    // When eyebrows are raised, multiply the vertical offset to make them shoot up
    // browRaiseAmount: 0 = neutral (1.0x), 1 = fully raised (1.8x)
    let heightMultiplier = 1.0 + (browRaiseAmount * 0.8);

    // Apply exaggeration, eye scale, and height multiplier
    let exaggeratedX = faceCenterX + (offsetX * CONFIG.eyebrows.exaggerationFactor * eyeScale);
    let exaggeratedY = faceCenterY + (offsetY * CONFIG.eyebrows.exaggerationFactor * eyeScale * heightMultiplier) + CONFIG.eyebrows.verticalOffset;

    curveVertex(exaggeratedX, exaggeratedY);
  }

  // Add extra point at the end for smooth curve
  let lastTop = face.keypoints[topPoints[topPoints.length - 1]];
  let lastBottom = face.keypoints[bottomPoints[bottomPoints.length - 1]];
  let lastCenterX = (lastTop.x + lastBottom.x) / 2;
  let lastCenterY = (lastTop.y + lastBottom.y) / 2;

  // Apply same height multiplier to last point
  let heightMultiplier = 1.0 + (browRaiseAmount * 0.8);

  // Apply exaggeration, eye scale, and height multiplier to last point
  let lastOffsetX = lastCenterX - faceCenterX;
  let lastOffsetY = lastCenterY - faceCenterY;
  let lastExaggeratedX = faceCenterX + (lastOffsetX * CONFIG.eyebrows.exaggerationFactor * eyeScale);
  let lastExaggeratedY = faceCenterY + (lastOffsetY * CONFIG.eyebrows.exaggerationFactor * eyeScale * heightMultiplier) + CONFIG.eyebrows.verticalOffset;

  curveVertex(lastExaggeratedX, lastExaggeratedY);

  endShape();
}
