// Lips component - handles lip tracking and rendering

function drawLips(face, distanceScale = 1, eyeScale = 1) {
  // Apply min/max scale limits
  let strokeScale = constrain(distanceScale, CONFIG.lips.minScale, CONFIG.lips.maxScale);

  // Calculate face center (nose tip area)
  let noseTip = face.keypoints[KEYPOINTS.NOSE_TIP];
  let faceCenterX = noseTip.x;
  let faceCenterY = noseTip.y;

  // Lip corner and center points
  let leftCorner = face.keypoints[KEYPOINTS.LIP_LEFT_CORNER];
  let rightCorner = face.keypoints[KEYPOINTS.LIP_RIGHT_CORNER];
  let topCenter = face.keypoints[KEYPOINTS.LIP_TOP_CENTER];
  let bottomCenter = face.keypoints[KEYPOINTS.LIP_BOTTOM_CENTER];

  // 입 중심점 계산
  let mouthCenterX = (leftCorner.x + rightCorner.x) / 2;
  let mouthCenterY = (topCenter.y + bottomCenter.y) / 2;

  // 입 열림 정도 계산 (위아래 중앙점 사이 거리)
  let mouthOpenDistance = dist(topCenter.x, topCenter.y, bottomCenter.x, bottomCenter.y);

  // 입 너비
  let mouthWidth = dist(leftCorner.x, leftCorner.y, rightCorner.x, rightCorner.y);

  // 입 열림 비율 (너비 대비 높이)
  let openRatio = mouthOpenDistance / mouthWidth;

  // Expose to global scope for event detection
  window.mouthOpenRatio = openRatio;

  // === MEASURE MOUTH CURVATURE (for emotion detection) ===
  // Compare corners vs center to detect smile/frown
  let avgCornerY = (leftCorner.y + rightCorner.y) / 2;
  let centerY = mouthCenterY;

  // Positive = smile (corners higher than center), Negative = frown (corners lower)
  let mouthCurvature = avgCornerY - centerY;

  // Normalize to -1 to 1 scale
  let mouthCurveAmount = constrain(map(mouthCurvature, -10, 10, 1.0, -1.0), -1, 1);
  // mouthCurveAmount: +1 = big smile, 0 = neutral, -1 = big frown

  // Store for other components to use
  window.mouthCurveAmount = mouthCurveAmount;

  // Apply exaggeration to mouth center position
  let offsetX = mouthCenterX - faceCenterX;
  let offsetY = mouthCenterY - faceCenterY;
  let exaggeratedCenterX = faceCenterX + (offsetX * CONFIG.lips.exaggerationFactor * eyeScale);
  let exaggeratedCenterY = faceCenterY + (offsetY * CONFIG.lips.exaggerationFactor * eyeScale) + CONFIG.lips.verticalOffset;

  // Calculate exaggerated mouth dimensions
  let exaggeratedWidth = mouthWidth * CONFIG.lips.exaggerationFactor * eyeScale;
  let exaggeratedHeight = mouthOpenDistance * CONFIG.lips.exaggerationFactor * eyeScale;

  // Draw based on mouth state
  noFill();
  stroke(...CONFIG.lips.color);
  strokeWeight(CONFIG.lips.strokeWeight * CONFIG.lips.exaggerationFactor * strokeScale);
  strokeCap(ROUND);

  // Lip keypoint arrays for both open and closed states
  let upperLipPoints = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
  let lowerLipPoints = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

  if (openRatio < CONFIG.lips.openThreshold) {
    // Closed mouth: draw a curved line following the center of upper and lower lips
    noFill();

    // Use only key points for smoother curve (reduce from 11 to 5 points)
    let smoothUpperPoints = [61, 39, 0, 269, 291];  // Left, left-center, center, right-center, right
    let smoothLowerPoints = [61, 181, 17, 405, 291];

    // Calculate center points
    let centerPoints = [];
    for (let i = 0; i < smoothUpperPoints.length; i++) {
      let upperPoint = face.keypoints[smoothUpperPoints[i]];
      let lowerPoint = face.keypoints[smoothLowerPoints[i]];

      // Center point between upper and lower lip
      let midX = (upperPoint.x + lowerPoint.x) / 2;
      let midY = (upperPoint.y + lowerPoint.y) / 2;

      // Apply exaggeration from face center
      let offsetX = midX - faceCenterX;
      let offsetY = midY - faceCenterY;
      let exaggeratedX = faceCenterX + (offsetX * CONFIG.lips.exaggerationFactor * eyeScale);
      let exaggeratedY = faceCenterY + (offsetY * CONFIG.lips.exaggerationFactor * eyeScale) + CONFIG.lips.verticalOffset;

      centerPoints.push({x: exaggeratedX, y: exaggeratedY});
    }

    // Draw smooth bezier-like curve
    beginShape();
    curveVertex(centerPoints[0].x, centerPoints[0].y);  // Control point
    for (let point of centerPoints) {
      curveVertex(point.x, point.y);
    }
    curveVertex(centerPoints[centerPoints.length - 1].x, centerPoints[centerPoints.length - 1].y);  // Control point
    endShape();
  } else {
    // Open mouth: draw a smooth oval following the inner lip contour
    noFill();

    // Use fewer key points for maximum smoothness
    let smoothUpperInner = [78, 81, 13, 311, 308];  // 5 points for smooth top curve
    let smoothLowerInner = [78, 178, 14, 402, 308];  // 5 points for smooth bottom curve

    // Calculate all points
    let allPoints = [];

    // Upper inner lip points
    for (let idx of smoothUpperInner) {
      let point = face.keypoints[idx];

      // Apply exaggeration from face center
      let offsetX = point.x - faceCenterX;
      let offsetY = point.y - faceCenterY;
      let exaggeratedX = faceCenterX + (offsetX * CONFIG.lips.exaggerationFactor * eyeScale);
      let exaggeratedY = faceCenterY + (offsetY * CONFIG.lips.exaggerationFactor * eyeScale) + CONFIG.lips.verticalOffset;

      allPoints.push({x: exaggeratedX, y: exaggeratedY});
    }

    // Lower inner lip points in reverse (skip first and last to avoid duplication)
    for (let i = smoothLowerInner.length - 2; i >= 1; i--) {
      let point = face.keypoints[smoothLowerInner[i]];

      // Apply exaggeration from face center
      let offsetX = point.x - faceCenterX;
      let offsetY = point.y - faceCenterY;
      let exaggeratedX = faceCenterX + (offsetX * CONFIG.lips.exaggerationFactor * eyeScale);
      let exaggeratedY = faceCenterY + (offsetY * CONFIG.lips.exaggerationFactor * eyeScale) + CONFIG.lips.verticalOffset;

      allPoints.push({x: exaggeratedX, y: exaggeratedY});
    }

    // Draw smooth closed curve with tighter curve for more smoothness
    curveTightness(0);  // 0 = maximum smoothness (Catmull-Rom spline)
    beginShape();
    // Add last two points as control points for smooth start
    curveVertex(allPoints[allPoints.length - 2].x, allPoints[allPoints.length - 2].y);
    curveVertex(allPoints[allPoints.length - 1].x, allPoints[allPoints.length - 1].y);

    // Draw all points
    for (let point of allPoints) {
      curveVertex(point.x, point.y);
    }

    // Add first two points again to close smoothly
    curveVertex(allPoints[0].x, allPoints[0].y);
    curveVertex(allPoints[1].x, allPoints[1].y);
    endShape();
  }
}
