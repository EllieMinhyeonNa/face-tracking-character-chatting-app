// Eyes component - handles eye tracking and rendering

function drawEyes(face) {
  // 왼쪽 눈 그리기
  if (face.keypoints.length > 468) {
    // 왼쪽 눈 주요 포인트
    let leftPupil = face.keypoints[468];  // 실제 동공 위치
    let leftCorner = face.keypoints[33];  // 왼쪽 눈 좌측 끝
    let rightCorner = face.keypoints[133]; // 왼쪽 눈 우측 끝
    let topPoint = face.keypoints[159];    // 왼쪽 눈 상단
    let bottomPoint = face.keypoints[145]; // 왼쪽 눈 하단

    // 눈 중심점 계산 (눈의 기하학적 중심)
    let eyeCenterX = (leftCorner.x + rightCorner.x) / 2;
    let eyeCenterY = (topPoint.y + bottomPoint.y) / 2;

    // 눈 크기 계산
    let eyeWidth = dist(leftCorner.x, leftCorner.y, rightCorner.x, rightCorner.y);
    let eyeHeight = dist(topPoint.x, topPoint.y, bottomPoint.x, bottomPoint.y);

    // 흰자 그리기 (눈 중심에 고정)
    fill(255, 255, 255);
    noStroke();
    ellipse(eyeCenterX, eyeCenterY, eyeWidth, eyeHeight * 1.8);

    // 동공 그리기 (실제 동공 위치 추적)
    fill(0, 0, 0); // 검정색
    circle(leftPupil.x, leftPupil.y, eyeHeight * 0.6);
  }

  // 오른쪽 눈 그리기
  if (face.keypoints.length > 473) {
    // 오른쪽 눈 주요 포인트
    let rightPupil = face.keypoints[473]; // 실제 동공 위치
    let leftCorner = face.keypoints[263];  // 오른쪽 눈 좌측 끝
    let rightCorner = face.keypoints[362]; // 오른쪽 눈 우측 끝
    let topPoint = face.keypoints[386];    // 오른쪽 눈 상단
    let bottomPoint = face.keypoints[374]; // 오른쪽 눈 하단

    // 눈 중심점 계산 (눈의 기하학적 중심)
    let eyeCenterX = (leftCorner.x + rightCorner.x) / 2;
    let eyeCenterY = (topPoint.y + bottomPoint.y) / 2;

    // 눈 크기 계산
    let eyeWidth = dist(leftCorner.x, leftCorner.y, rightCorner.x, rightCorner.y);
    let eyeHeight = dist(topPoint.x, topPoint.y, bottomPoint.x, bottomPoint.y);

    // 흰자 그리기 (눈 중심에 고정)
    fill(255, 255, 255);
    noStroke();
    ellipse(eyeCenterX, eyeCenterY, eyeWidth, eyeHeight * 1.8);

    // 동공 그리기 (실제 동공 위치 추적)
    fill(0, 0, 0); // 검정색
    circle(rightPupil.x, rightPupil.y, eyeHeight * 0.6);
  }
}
