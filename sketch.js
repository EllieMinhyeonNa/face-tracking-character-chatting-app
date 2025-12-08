// Main sketch file - orchestrates face tracking and rendering
// Now with multi-user support!

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

  // Initialize networking
  initNetworking();
}

function draw() {
  try {
    // Draw background or video feed
    if (CONFIG.canvas.showVideo) {
      image(video, 0, 0, width, height);
    } else {
      background(...CONFIG.canvas.backgroundColor);
    }

    // === MY CHARACTER (from local webcam) ===
    let myFaceData = null;

    if (faces.length > 0) {
      let face = faces[0];

      // Extract face data for networking
      myFaceData = extractFaceData(face);

      // Send to server
      sendFaceData(myFaceData);
    }

  // === RENDER ALL CHARACTERS (me + remote peer) ===
  let allParticipants = [];

  // Add my character first
  if (myFaceData) {
    allParticipants.push({
      id: 'me',
      data: myFaceData,
      isLocal: true
    });
  }

  // Add remote peer
  let remoteFaceData = getRemoteFaceData();
  if (remoteFaceData) {
    allParticipants.push({
      id: 'peer',
      data: remoteFaceData,
      isLocal: false
    });
  }

  // For single LOCAL participant (waiting for peer), use original direct rendering
  if (allParticipants.length === 1 && allParticipants[0].isLocal && faces.length > 0) {
    let face = faces[0];
    let faceData = allParticipants[0].data;

    // Calculate distance-based scale
    let distanceScale = faceData.distanceScale;
    let eyeScale = faceData.eyeScale;

    // Get expression measurements
    let browRaiseAmount = faceData.browRaiseAmount;
    let mouthOpenRatio = faceData.mouthOpenRatio;

    // Detect "surprised" event
    let isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

    // Activate/deactivate effects based on events
    if (isSurprised) {
      activateSpeedLines();
    } else {
      deactivateSpeedLines();
    }

    // Draw speed lines BEFORE character (background effect)
    drawSpeedLines(browRaiseAmount, faceData.faceCenterX, faceData.faceCenterY);

    // Draw debug keypoints FIRST (so components are drawn on top)
    if (CONFIG.debug.showKeypoints) {
      drawFaceKeypoints(face);
    }

    // Draw components directly at their actual positions
    drawEyes(face, distanceScale);
    drawLips(face, distanceScale, eyeScale);
    drawEyebrows(face, distanceScale, eyeScale);

    return;
  }

  // Calculate grid positions (2x2 layout)
  let gridPositions = calculateGridPositions(allParticipants.length);

  // Draw grid borders
  drawGridBorders(allParticipants.length);

  // Render each character
  allParticipants.forEach((participant, index) => {
    let pos = gridPositions[index];

    push();
    // Move to grid cell center
    translate(pos.x, pos.y);

    // Scale down
    scale(pos.scale);

    // Center the character in this grid cell by offsetting by face center
    // Works for BOTH local and remote characters (they all have faceCenterX/Y)
    if (participant.data && participant.data.faceCenterX !== undefined) {
      translate(-participant.data.faceCenterX, -participant.data.faceCenterY);
    }

    // Render this character
    renderCharacter(participant.data, participant.isLocal, faces.length > 0 ? faces[0] : null);

    // Optional: Show participant ID for debugging
    if (CONFIG.debug.showParticipantIds) {
      fill(255, 255, 0);
      noStroke();
      textSize(12);
      textAlign(CENTER, TOP);
      text(participant.isLocal ? 'YOU' : participant.id.slice(0, 6), 0, -200);
    }

    pop();
  });

  } catch (error) {
    console.error('❌ Draw error:', error);
    // Don't crash - just log the error and continue
  }
}

/**
 * Render a single character from face data
 * @param {object} faceData - Face data (local or remote)
 * @param {boolean} isLocal - Whether this is the local user
 * @param {object} face - Full face object (only for local)
 */
function renderCharacter(faceData, isLocal, face) {
  if (!faceData) return;

  // For local character, we have the full face object
  // For remote characters, we reconstruct from transmitted data

  if (isLocal && face) {
    // Use original rendering logic for local character

    // Calculate scales
    let distanceScale = faceData.distanceScale;
    let eyeScale = faceData.eyeScale;

    // Get expressions
    let browRaiseAmount = faceData.browRaiseAmount;
    let mouthOpenRatio = faceData.mouthOpenRatio;

    // Detect events
    let isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

    // Activate/deactivate effects
    if (isSurprised) {
      activateSpeedLines();
    } else {
      deactivateSpeedLines();
    }

    // Draw speed lines
    drawSpeedLines(browRaiseAmount, faceData.faceCenterX, faceData.faceCenterY);

    // Draw debug keypoints
    if (CONFIG.debug.showKeypoints) {
      drawFaceKeypoints(face);
    }

    // Draw components
    drawEyes(face, distanceScale);
    drawLips(face, distanceScale, eyeScale);
    drawEyebrows(face, distanceScale, eyeScale);

  } else {
    // Remote character - reconstruct from transmitted essential keypoints
    if (!faceData.keypoints) {
      // Fallback if keypoints not available
      push();
      fill(150);
      noStroke();
      textSize(16);
      textAlign(CENTER, CENTER);
      text('Remote\nCharacter', 0, 0);
      pop();
      return;
    }

    // Reconstruct a "fake face object" with the essential keypoints
    // This allows us to use the existing drawing functions!
    let remoteFace = reconstructFaceFromKeypoints(faceData.keypoints);

    let browRaiseAmount = faceData.browRaiseAmount || 0;
    let mouthOpenRatio = faceData.mouthOpenRatio || 0;
    let distanceScale = faceData.distanceScale || 1;
    let eyeScale = faceData.eyeScale || 1;

    // Detect events for remote character
    let isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

    // Draw speed lines for remote character
    if (isSurprised) {
      drawSpeedLines(browRaiseAmount, 0, 0);
    }

    // Draw components using existing functions!
    drawEyes(remoteFace, distanceScale);
    drawLips(remoteFace, distanceScale, eyeScale);
    drawEyebrows(remoteFace, distanceScale, eyeScale);
  }
}

/**
 * Reconstruct a face object from transmitted essential keypoints
 * Creates a sparse face.keypoints array with only the points we need
 * @param {object} essentialKeypoints - Object with named keypoints
 * @returns {object} Face-like object with keypoints array
 */
function reconstructFaceFromKeypoints(kp) {
  // Create a sparse array (most indices will be undefined)
  let keypoints = [];

  // Helper to add a point to the array
  function setPoint(index, point) {
    keypoints[index] = point;
  }

  // Helper to add array of points
  function setPointArray(indices, points) {
    indices.forEach((idx, i) => {
      keypoints[idx] = points[i];
    });
  }

  // Face structure
  setPoint(KEYPOINTS.NOSE_BRIDGE, kp.NOSE_BRIDGE);
  setPoint(KEYPOINTS.NOSE_TIP, kp.NOSE_TIP);
  setPoint(KEYPOINTS.LEFT_FACE_EDGE, kp.LEFT_FACE_EDGE);
  setPoint(KEYPOINTS.RIGHT_FACE_EDGE, kp.RIGHT_FACE_EDGE);

  // Eyes
  setPoint(KEYPOINTS.LEFT_PUPIL, kp.LEFT_PUPIL);
  setPoint(KEYPOINTS.LEFT_EYE_LEFT_CORNER, kp.LEFT_EYE_LEFT_CORNER);
  setPoint(KEYPOINTS.LEFT_EYE_RIGHT_CORNER, kp.LEFT_EYE_RIGHT_CORNER);
  setPoint(KEYPOINTS.LEFT_EYE_TOP, kp.LEFT_EYE_TOP);
  setPoint(KEYPOINTS.LEFT_EYE_BOTTOM, kp.LEFT_EYE_BOTTOM);

  setPoint(KEYPOINTS.RIGHT_PUPIL, kp.RIGHT_PUPIL);
  setPoint(KEYPOINTS.RIGHT_EYE_LEFT_CORNER, kp.RIGHT_EYE_LEFT_CORNER);
  setPoint(KEYPOINTS.RIGHT_EYE_RIGHT_CORNER, kp.RIGHT_EYE_RIGHT_CORNER);
  setPoint(KEYPOINTS.RIGHT_EYE_TOP, kp.RIGHT_EYE_TOP);
  setPoint(KEYPOINTS.RIGHT_EYE_BOTTOM, kp.RIGHT_EYE_BOTTOM);

  // Eyebrows
  setPointArray(KEYPOINTS.EYEBROW_LEFT_TOP_ROW, kp.EYEBROW_LEFT_TOP_ROW);
  setPointArray(KEYPOINTS.EYEBROW_LEFT_BOTTOM_ROW, kp.EYEBROW_LEFT_BOTTOM_ROW);
  setPointArray(KEYPOINTS.EYEBROW_RIGHT_TOP_ROW, kp.EYEBROW_RIGHT_TOP_ROW);
  setPointArray(KEYPOINTS.EYEBROW_RIGHT_BOTTOM_ROW, kp.EYEBROW_RIGHT_BOTTOM_ROW);

  // Lips - basic points
  setPoint(KEYPOINTS.LIP_LEFT_CORNER, kp.LIP_LEFT_CORNER);
  setPoint(KEYPOINTS.LIP_RIGHT_CORNER, kp.LIP_RIGHT_CORNER);
  setPoint(KEYPOINTS.LIP_TOP_CENTER, kp.LIP_TOP_CENTER);
  setPoint(KEYPOINTS.LIP_BOTTOM_CENTER, kp.LIP_BOTTOM_CENTER);

  // Lips - smooth curves (map to sparse array)
  setPointArray([61, 39, 0, 269, 291], kp.LIP_SMOOTH_UPPER);
  setPointArray([61, 181, 17, 405, 291], kp.LIP_SMOOTH_LOWER);
  setPointArray([78, 81, 13, 311, 308], kp.LIP_UPPER_INNER);
  setPointArray([78, 178, 14, 402, 308], kp.LIP_LOWER_INNER);

  return { keypoints: keypoints };
}

/**
 * Draw grid borders to visually separate participants
 * @param {number} count - Number of participants
 */
function drawGridBorders(count) {
  if (count === 2) {
    // Vertical line in the middle for 2 people
    stroke(255);
    strokeWeight(4);
    line(width/2, 0, width/2, height);
  }
}

/**
 * Calculate grid positions for 1-2 participants
 * @param {number} count - Number of participants
 * @returns {array} Array of {x, y, scale} positions
 */
function calculateGridPositions(count) {
  if (count === 1) {
    // Single person - centered, full size
    return [{x: width/2, y: height/2, scale: 1}];
  }

  // Two people - side by side
  return [
    {x: width * 0.25, y: height/2, scale: 0.9},
    {x: width * 0.75, y: height/2, scale: 0.9}
  ];
}

function gotFaces(results) {
  faces = results;

  // Debug: Log face detection
  if (frameCount % 60 === 0) { // Log every 60 frames (once per second)
    console.log('Face detection:', faces.length, 'faces detected');
  }
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
  if (key === 'p' || key === 'P') {
    CONFIG.debug.showParticipantIds = !CONFIG.debug.showParticipantIds;
    console.log('Participant IDs:', CONFIG.debug.showParticipantIds ? 'ON' : 'OFF');
  }
  if (key === 'h' || key === 'H') {
    // Show help menu
    console.log('=== KEYBOARD SHORTCUTS ===');
    console.log('I: Toggle keypoint index display');
    console.log('K: Toggle keypoints display');
    console.log('D: Toggle eyebrow debug points');
    console.log('V: Toggle video feed');
    console.log('P: Toggle participant IDs');
    console.log('H: Show this help menu');
  }
}
