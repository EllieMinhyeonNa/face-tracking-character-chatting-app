let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  image(video, 0, 0, width, height);
  
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    
    // 일반 얼굴 keypoints 그리기
    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 5);
    }
    
    // 왼쪽 눈 원 그리기
    if (face.keypoints.length > 468) {
      let leftPupil = face.keypoints[468];
      noFill();
      stroke(0, 255, 255);
      strokeWeight(3);
      circle(leftPupil.x, leftPupil.y, 60);
    }

    // 오른쪽 눈 원 그리기
    if (face.keypoints.length > 473) {
      let rightPupil = face.keypoints[473];
      noFill();
      stroke(0, 255, 255);
      strokeWeight(3);
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
}

function gotFaces(results) {
  faces = results;
}