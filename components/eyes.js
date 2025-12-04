// Eyes component - handles eye tracking and rendering

function drawEyes(face) {
  // 왼쪽 눈 원 그리기
  if (face.keypoints.length > 468) {
    let leftPupil = face.keypoints[468];
    fill(255, 255, 255);
    circle(leftPupil.x, leftPupil.y, 60);
  }

  // 오른쪽 눈 원 그리기
  if (face.keypoints.length > 473) {
    let rightPupil = face.keypoints[473];
    fill(255, 255, 255);
    circle(rightPupil.x, rightPupil.y, 60);
  }

  // 왼쪽 동공 중심점 (인덱스 468)
  if (face.keypoints.length > 468) {
    let leftPupil = face.keypoints[468];
    fill(255, 0, 255); // 핑크색
    noStroke();
    circle(leftPupil.x, leftPupil.y, 12);
  }

  // 오른쪽 동공 중심점 (인덱스 473)
  if (face.keypoints.length > 473) {
    let rightPupil = face.keypoints[473];
    fill(255, 0, 255); // 핑크색
    noStroke();
    circle(rightPupil.x, rightPupil.y, 12);
  }
}
