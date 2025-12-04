// Eyebrows component - handles eyebrow tracking and rendering

function drawEyebrows(face) {
  // Left eyebrow - top and bottom rows
  let leftBrowTop = [70, 63, 105, 66, 107];
  let leftBrowBottom = [46, 53, 52, 65, 55];

  // Right eyebrow - top and bottom rows
  let rightBrowTop = [300, 293, 334, 296, 336];
  let rightBrowBottom = [276, 283, 282, 295, 285];

  // Draw left eyebrow
  drawEyebrow(face, leftBrowTop, leftBrowBottom);

  // Draw right eyebrow
  drawEyebrow(face, rightBrowTop, rightBrowBottom);
}

function drawEyebrow(face, topPoints, bottomPoints) {
  // Mark the keypoints with RED circles to visualize which indices are used
  for (let idx of topPoints) {
    let point = face.keypoints[idx];
    fill(255, 0, 0, 150); // Red with transparency
    noStroke();
    circle(point.x, point.y, 8);
  }
  for (let idx of bottomPoints) {
    let point = face.keypoints[idx];
    fill(255, 0, 0, 150); // Red with transparency
    noStroke();
    circle(point.x, point.y, 8);
  }

  // Draw the eyebrow curve through the center of top and bottom points
  noFill();
  stroke(0, 0, 0); // Black eyebrow
  strokeWeight(7);
  strokeCap(ROUND);

  beginShape();

  // Calculate center points between top and bottom rows
  for (let i = 0; i < topPoints.length; i++) {
    let topPoint = face.keypoints[topPoints[i]];
    let bottomPoint = face.keypoints[bottomPoints[i]];

    // Center point between top and bottom
    let centerX = (topPoint.x + bottomPoint.x) / 2;
    let centerY = (topPoint.y + bottomPoint.y) / 2;

    curveVertex(centerX, centerY);
  }

  // Add extra point at the end for smooth curve
  let lastTop = face.keypoints[topPoints[topPoints.length - 1]];
  let lastBottom = face.keypoints[bottomPoints[bottomPoints.length - 1]];
  let lastCenterX = (lastTop.x + lastBottom.x) / 2;
  let lastCenterY = (lastTop.y + lastBottom.y) / 2;
  curveVertex(lastCenterX, lastCenterY);

  endShape();
}
