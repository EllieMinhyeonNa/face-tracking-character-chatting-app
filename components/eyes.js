// Eyes component - handles eye tracking and rendering

// Keypoint indices for eyes
const EYE_KEYPOINTS = {
  left: {
    pupil: 468,
    leftCorner: 33,
    rightCorner: 133,
    top: 159,
    bottom: 145
  },
  right: {
    pupil: 473,
    leftCorner: 263,
    rightCorner: 362,
    top: 386,
    bottom: 374
  }
};

function drawEyes(face, distanceScale = 1) {
  if (face.keypoints.length > 473) {
    // Apply min/max scale limits to distanceScale
    let clampedScale = constrain(distanceScale, CONFIG.eyes.minScale, CONFIG.eyes.maxScale);
    // 왼쪽 눈 주요 포인트
    let leftPupil = face.keypoints[468];
    let leftEyeLeftCorner = face.keypoints[33];
    let leftEyeRightCorner = face.keypoints[133];
    let leftEyeTop = face.keypoints[159];
    let leftEyeBottom = face.keypoints[145];

    // 오른쪽 눈 주요 포인트
    let rightPupil = face.keypoints[473];
    let rightEyeLeftCorner = face.keypoints[263];
    let rightEyeRightCorner = face.keypoints[362];
    let rightEyeTop = face.keypoints[386];
    let rightEyeBottom = face.keypoints[374];

    // 왼쪽 눈 원래 중심과 크기
    let leftOriginalCenterX = (leftEyeLeftCorner.x + leftEyeRightCorner.x) / 2;
    let leftOriginalCenterY = (leftEyeTop.y + leftEyeBottom.y) / 2;
    let leftRealWidth = dist(leftEyeLeftCorner.x, leftEyeLeftCorner.y, leftEyeRightCorner.x, leftEyeRightCorner.y);
    let leftRealHeight = dist(leftEyeTop.x, leftEyeTop.y, leftEyeBottom.x, leftEyeBottom.y);

    // 오른쪽 눈 원래 중심과 크기
    let rightOriginalCenterX = (rightEyeLeftCorner.x + rightEyeRightCorner.x) / 2;
    let rightOriginalCenterY = (rightEyeTop.y + rightEyeBottom.y) / 2;
    let rightRealWidth = dist(rightEyeLeftCorner.x, rightEyeLeftCorner.y, rightEyeRightCorner.x, rightEyeRightCorner.y);
    let rightRealHeight = dist(rightEyeTop.x, rightEyeTop.y, rightEyeBottom.x, rightEyeBottom.y);

    // 두 눈 사이의 중간점 (얼굴 중심)
    let faceCenterX = (leftOriginalCenterX + rightOriginalCenterX) / 2;
    let faceCenterY = (leftOriginalCenterY + rightOriginalCenterY) / 2;

    // 얼굴 기울기 각도 계산 (왼쪽 눈과 오른쪽 눈을 연결한 선의 각도)
    let faceRotationAngle = atan2(
      rightOriginalCenterY - leftOriginalCenterY,
      rightOriginalCenterX - leftOriginalCenterX
    );

    // 과장된 눈 크기 계산 (제한된 거리 스케일 적용)
    let leftExaggeratedWidth = leftRealWidth * CONFIG.eyes.exaggerationFactor * clampedScale;
    let leftExaggeratedHeight = leftExaggeratedWidth * CONFIG.eyes.aspectRatio;

    let rightExaggeratedWidth = rightRealWidth * CONFIG.eyes.exaggerationFactor * clampedScale;
    let rightExaggeratedHeight = rightExaggeratedWidth * CONFIG.eyes.aspectRatio;

    // 회전을 고려한 눈 사이 간격 계산
    // 두 눈의 평균 반지름
    let avgRadius = (leftExaggeratedWidth + rightExaggeratedWidth) / 4;

    // 회전 각도를 고려하여 중심점에서 각 눈까지의 거리 계산
    // cos(angle)을 사용하여 회전 시 간격 조정
    let horizontalSeparation = avgRadius / cos(faceRotationAngle);

    // 왼쪽 눈: 얼굴 중심에서 왼쪽으로 정확히 조정된 거리만큼 떨어진 위치
    let leftNewCenterX = faceCenterX - horizontalSeparation;
    let leftNewCenterY = leftOriginalCenterY + CONFIG.eyes.verticalOffset;

    // 오른쪽 눈: 얼굴 중심에서 오른쪽으로 정확히 조정된 거리만큼 떨어진 위치
    let rightNewCenterX = faceCenterX + horizontalSeparation;
    let rightNewCenterY = rightOriginalCenterY + CONFIG.eyes.verticalOffset;

    // 왼쪽 눈 열림 비율
    let leftMaxHeight = leftRealWidth * 0.5;
    let leftOpenRatio = leftRealHeight / leftMaxHeight;
    leftOpenRatio = constrain(leftOpenRatio, 0, 1);
    let leftAnimatedHeight = leftExaggeratedHeight * leftOpenRatio;

    // 오른쪽 눈 열림 비율
    let rightMaxHeight = rightRealWidth * 0.5;
    let rightOpenRatio = rightRealHeight / rightMaxHeight;
    rightOpenRatio = constrain(rightOpenRatio, 0, 1);
    let rightAnimatedHeight = rightExaggeratedHeight * rightOpenRatio;

    // 왼쪽 눈 흰자 그리기
    push();
    translate(leftNewCenterX, leftNewCenterY);
    rotate(faceRotationAngle);
    fill(255, 255, 255);
    noStroke();
    ellipse(0, 0, leftExaggeratedWidth, leftAnimatedHeight);
    pop();

    // 왼쪽 동공
    let leftPupilSize = leftExaggeratedHeight * CONFIG.eyes.pupilSizeRatio;

    // 동공 위치 오프셋 계산 (원래 눈 중심에서 얼마나 떨어져 있는지)
    let leftPupilOffsetX = leftPupil.x - leftOriginalCenterX;
    let leftPupilOffsetY = leftPupil.y - leftOriginalCenterY;

    // 새로운 눈 위치에 맞게 동공 위치 조정
    let leftNewPupilX = leftNewCenterX + leftPupilOffsetX;
    let leftNewPupilY = leftNewCenterY + leftPupilOffsetY;

    push();
    translate(leftNewCenterX, leftNewCenterY);
    rotate(faceRotationAngle);
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.ellipse(0, 0, leftExaggeratedWidth / 2, leftAnimatedHeight / 2, 0, 0, TWO_PI);
    drawingContext.clip();
    fill(0, 0, 0);
    circle(leftPupilOffsetX, leftPupilOffsetY, leftPupilSize);
    drawingContext.restore();
    pop();

    // 오른쪽 눈 흰자 그리기
    push();
    translate(rightNewCenterX, rightNewCenterY);
    rotate(faceRotationAngle);
    fill(255, 255, 255);
    noStroke();
    ellipse(0, 0, rightExaggeratedWidth, rightAnimatedHeight);
    pop();

    // 오른쪽 동공
    let rightPupilSize = rightExaggeratedHeight * CONFIG.eyes.pupilSizeRatio;

    // 동공 위치 오프셋 계산 (원래 눈 중심에서 얼마나 떨어져 있는지)
    let rightPupilOffsetX = rightPupil.x - rightOriginalCenterX;
    let rightPupilOffsetY = rightPupil.y - rightOriginalCenterY;

    // 새로운 눈 위치에 맞게 동공 위치 조정
    let rightNewPupilX = rightNewCenterX + rightPupilOffsetX;
    let rightNewPupilY = rightNewCenterY + rightPupilOffsetY;

    push();
    translate(rightNewCenterX, rightNewCenterY);
    rotate(faceRotationAngle);
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.ellipse(0, 0, rightExaggeratedWidth / 2, rightAnimatedHeight / 2, 0, 0, TWO_PI);
    drawingContext.clip();
    fill(0, 0, 0);
    circle(rightPupilOffsetX, rightPupilOffsetY, rightPupilSize);
    drawingContext.restore();
    pop();
  }
}
