// Main sketch file - orchestrates face tracking and rendering

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
  // Draw background or video feed
  if (CONFIG.canvas.showVideo) {
    image(video, 0, 0, width, height);
  } else {
    background(...CONFIG.canvas.backgroundColor);
  }

  // === EVENT DETECTION & EFFECTS ===
  let isSurprised = false;

  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];

    // Calculate distance-based scale
    let distanceScale = calculateDistanceScale(face);

    // Calculate eye scale (clamped to eye limits)
    let eyeScale = constrain(distanceScale, CONFIG.eyes.minScale, CONFIG.eyes.maxScale);

    // Get expression measurements from components
    // Note: These are set as global variables by the components
    let browRaiseAmount = window.browRaiseAmount || 0;
    let mouthOpenRatio = window.mouthOpenRatio || 0;

    // Detect "surprised" event
    isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

    // Activate/deactivate effects based on events
    if (isSurprised) {
      activateSpeedLines();
    } else {
      deactivateSpeedLines();
    }

    // Calculate face center for effects
    let noseBridge = face.keypoints[KEYPOINTS.NOSE_BRIDGE];
    let faceCenterX = noseBridge.x;
    let faceCenterY = noseBridge.y;

    // Draw speed lines BEFORE character (background effect)
    // Lines follow the face center position
    drawSpeedLines(browRaiseAmount, faceCenterX, faceCenterY);

    // Draw debug keypoints FIRST (so components are drawn on top)
    if (CONFIG.debug.showKeypoints) {
      drawFaceKeypoints(face);
    }

    // 각 컴포넌트 렌더링 (거리 스케일 전달) - drawn AFTER keypoints
    drawEyes(face, distanceScale);           // eyes.js
    drawLips(face, distanceScale, eyeScale); // lips.js - also receives eye scale
    drawEyebrows(face, distanceScale, eyeScale);  // eyebrows.js - also receives eye scale
  }
}

function gotFaces(results) {
  faces = results;
}

// Helper function: Calculate distance scale based on face width
function calculateDistanceScale(face) {
  let leftFaceEdge = face.keypoints[KEYPOINTS.LEFT_FACE_EDGE];
  let rightFaceEdge = face.keypoints[KEYPOINTS.RIGHT_FACE_EDGE];
  let faceWidth = dist(leftFaceEdge.x, leftFaceEdge.y, rightFaceEdge.x, rightFaceEdge.y);
  return faceWidth / CONFIG.distance.baseFaceWidth;
}

// Helper function: Draw face mesh keypoints for debugging
function drawFaceKeypoints(face) {
  for (let j = 0; j < face.keypoints.length; j++) {
    let keypoint = face.keypoints[j];
    fill(0, 255, 0);
    noStroke();
    circle(keypoint.x, keypoint.y, 5);

    if (CONFIG.debug.showIndices) {
      fill(255, 255, 0);
      textSize(10);
      textAlign(CENTER, CENTER);
      text(j, keypoint.x, keypoint.y - 10);
    }
  }
}

// Keyboard controls
function keyPressed() {
  if (key === 'i' || key === 'I') {
    CONFIG.debug.showIndices = !CONFIG.debug.showIndices;
    console.log('Index display:', CONFIG.debug.showIndices ? 'ON' : 'OFF');
  }
  if (key === 'k' || key === 'K') {
    CONFIG.debug.showKeypoints = !CONFIG.debug.showKeypoints;
    console.log('Keypoints display:', CONFIG.debug.showKeypoints ? 'ON' : 'OFF');
  }
  if (key === 'd' || key === 'D') {
    CONFIG.eyebrows.showDebugPoints = !CONFIG.eyebrows.showDebugPoints;
    console.log('Eyebrow debug points:', CONFIG.eyebrows.showDebugPoints ? 'ON' : 'OFF');
  }
  if (key === 'v' || key === 'V') {
    CONFIG.canvas.showVideo = !CONFIG.canvas.showVideo;
    console.log('Video display:', CONFIG.canvas.showVideo ? 'ON' : 'OFF');
  }
  if (key === 'h' || key === 'H') {
    // Show help menu
    console.log('=== KEYBOARD SHORTCUTS ===');
    console.log('I: Toggle keypoint index display');
    console.log('K: Toggle keypoints display');
    console.log('D: Toggle eyebrow debug points');
    console.log('V: Toggle video feed');
    console.log('H: Show this help menu');
  }
}