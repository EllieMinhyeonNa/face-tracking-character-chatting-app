// Lips component - handles lip tracking and rendering

function drawLips(face) {
  // 입술 주요 포인트
  let leftCorner = face.keypoints[61];   // 왼쪽 끝점
  let rightCorner = face.keypoints[291]; // 오른쪽 끝점
  let topCenter = face.keypoints[13];    // 위 중앙
  let bottomCenter = face.keypoints[14]; // 아래 중앙

  // 입술 곡선을 위한 중간 포인트들
  let upperLipPoints = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
  let lowerLipPoints = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

  // 입술 내부선 (입이 열렸을 때 사용)
  let upperInnerLip = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  let lowerInnerLip = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

  // 입 열림 정도 계산 (위아래 중앙점 사이 거리)
  let mouthOpenDistance = dist(topCenter.x, topCenter.y, bottomCenter.x, bottomCenter.y);

  // 입 너비
  let mouthWidth = dist(leftCorner.x, leftCorner.y, rightCorner.x, rightCorner.y);

  // 입 열림 비율 (너비 대비 높이)
  let openRatio = mouthOpenDistance / mouthWidth;

  // 임계값: 입이 충분히 열렸는지 판단
  let threshold = 0.15;

  if (openRatio < threshold) {
    // 입이 닫혔을 때: 중앙선 곡선 (미소)
    noFill();
    stroke(160, 82, 45); // 갈색
    strokeWeight(4);
    strokeCap(ROUND);

    beginShape();
    // 각 인덱스에 대해 위아래 입술의 중간 지점 계산
    for (let i = 0; i < upperLipPoints.length; i++) {
      let upperPoint = face.keypoints[upperLipPoints[i]];
      let lowerPoint = face.keypoints[lowerLipPoints[i]];

      // 위아래 중간점
      let midX = (upperPoint.x + lowerPoint.x) / 2;
      let midY = (upperPoint.y + lowerPoint.y) / 2;

      curveVertex(midX, midY);
    }
    endShape();
  } else {
    // 입이 열렸을 때: 타원/원 (내부선 사용)
    fill(255, 100, 120); // 핑크/레드
    stroke(160, 82, 45); // 갈색 테두리
    strokeWeight(3);

    // 윗입술 내부선과 아랫입술 내부선을 연결하여 입 안쪽 영역 생성
    beginShape();
    // 윗입술 내부선 그리기
    for (let idx of upperInnerLip) {
      let point = face.keypoints[idx];
      curveVertex(point.x, point.y);
    }
    // 아랫입술 내부선 역순으로 그리기
    for (let i = lowerInnerLip.length - 1; i >= 0; i--) {
      let point = face.keypoints[lowerInnerLip[i]];
      curveVertex(point.x, point.y);
    }
    endShape(CLOSE);
  }
}
