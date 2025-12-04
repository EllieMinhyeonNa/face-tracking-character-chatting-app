// Main sketch file - orchestrates face tracking and rendering

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };
let showIndices = false; // Toggle to show keypoint indices

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

      // 인덱스 번호 표시 (토글 가능)
      if (showIndices) {
        fill(255, 255, 0);
        textSize(10);
        textAlign(CENTER, CENTER);
        text(j, keypoint.x, keypoint.y - 10);
      }
    }

    // 각 컴포넌트 렌더링 (components 폴더에서 가져옴)
    drawEyes(face);      // eyes.js
    drawLips(face);      // lips.js
    drawEyebrows(face);  // eyebrows.js
  }
}

function gotFaces(results) {
  faces = results;
}

// 키보드 'i' 키를 눌러 인덱스 표시 토글
function keyPressed() {
  if (key === 'i' || key === 'I') {
    showIndices = !showIndices;
    console.log('Index display:', showIndices ? 'ON' : 'OFF');
  }
}