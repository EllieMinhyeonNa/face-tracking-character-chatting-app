// Lips component - handles lip tracking and rendering

function drawLips(face) {
  // 윗입술 외곽선 인덱스
  let upperOuterLip = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
  // 아랫입술 외곽선 인덱스
  let lowerOuterLip = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
  // 윗입술 내부선 인덱스
  let upperInnerLip = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  // 아랫입술 내부선 인덱스
  let lowerInnerLip = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

  // 윗입술 채우기
  fill(255, 100, 120, 200); // 반투명 핑크/레드
  stroke(200, 50, 70);
  strokeWeight(2);
  beginShape();
  // 외곽선을 먼저 그리고
  for (let idx of upperOuterLip) {
    let point = face.keypoints[idx];
    curveVertex(point.x, point.y);
  }
  // 내부선을 역순으로 연결
  for (let i = upperInnerLip.length - 1; i >= 0; i--) {
    let point = face.keypoints[upperInnerLip[i]];
    curveVertex(point.x, point.y);
  }
  endShape(CLOSE);

  // 아랫입술 채우기
  fill(255, 100, 120, 200); // 반투명 핑크/레드
  stroke(200, 50, 70);
  strokeWeight(2);
  beginShape();
  // 외곽선을 먼저 그리고
  for (let idx of lowerOuterLip) {
    let point = face.keypoints[idx];
    curveVertex(point.x, point.y);
  }
  // 내부선을 역순으로 연결
  for (let i = lowerInnerLip.length - 1; i >= 0; i--) {
    let point = face.keypoints[lowerInnerLip[i]];
    curveVertex(point.x, point.y);
  }
  endShape(CLOSE);
}
