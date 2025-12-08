// Main sketch file - orchestrates face tracking and rendering
// Now with per-participant canvas support for effects!

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

// Main canvas for character rendering (eyes, lips, eyebrows)
let mainCanvas;

// Separate canvases for effects (speed lines) - one per participant
let effectsCanvas1 = null;
let effectsCanvas2 = null;

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  // Create main canvas for character rendering
  mainCanvas = createCanvas(windowWidth, windowHeight);
  mainCanvas.parent('app-container');
  mainCanvas.style('position', 'absolute');
  mainCanvas.style('top', '0');
  mainCanvas.style('left', '0');
  mainCanvas.style('pointer-events', 'none');
  mainCanvas.style('z-index', '1');

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);

  // Initialize networking
  initNetworking();

  // Create effects canvases
  setupEffectsCanvases();
}

/**
 * Create separate canvas for each participant's effects
 */
function setupEffectsCanvases() {
  let box1 = document.getElementById('participant-1');
  let box2 = document.getElementById('participant-2');

  if (box1 && !effectsCanvas1) {
    // CRITICAL: Ensure parent has position relative so absolute canvas stays inside
    box1.style.position = 'relative';

    let rect = box1.getBoundingClientRect();
    effectsCanvas1 = createGraphics(rect.width, rect.height);

    let canvasElement1 = effectsCanvas1.canvas;
    canvasElement1.style.position = 'absolute';
    canvasElement1.style.top = '0';
    canvasElement1.style.left = '0';
    // Don't set CSS width/height - let it use native canvas dimensions
    canvasElement1.style.pointerEvents = 'none';
    canvasElement1.style.zIndex = '2'; // In front of main canvas (which is z-index: 1)
    box1.appendChild(canvasElement1);
  }

  if (box2 && !effectsCanvas2) {
    // CRITICAL: Ensure parent has position relative so absolute canvas stays inside
    box2.style.position = 'relative';

    let rect = box2.getBoundingClientRect();
    effectsCanvas2 = createGraphics(rect.width, rect.height);

    let canvasElement2 = effectsCanvas2.canvas;
    canvasElement2.style.position = 'absolute';
    canvasElement2.style.top = '0';
    canvasElement2.style.left = '0';
    // Don't set CSS width/height - let it use native canvas dimensions
    canvasElement2.style.pointerEvents = 'none';
    canvasElement2.style.zIndex = '2'; // In front of main canvas (which is z-index: 1)
    box2.appendChild(canvasElement2);
  }
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recreate effects canvases
  if (effectsCanvas1) {
    effectsCanvas1.remove();
    effectsCanvas1 = null;
  }
  if (effectsCanvas2) {
    effectsCanvas2.remove();
    effectsCanvas2 = null;
  }
  setupEffectsCanvases();
}

function draw() {
  try {
    // Clear main canvas (transparent background so UI shows through)
    clear();

    // Clear effects canvases
    if (effectsCanvas1) effectsCanvas1.clear();
    if (effectsCanvas2) effectsCanvas2.clear();

    // === MY CHARACTER (from local webcam) ===
    let myFaceData = null;

    if (faces.length > 0) {
      let face = faces[0];

      // Extract face data for networking
      myFaceData = extractFaceData(face);

      // Send to peer
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

  // Update UI to show/hide second participant
  let connected = isConnected();
  if (typeof updateConnectionUI === 'function') {
    updateConnectionUI(connected);
  }

  // Ensure effects canvases exist
  setupEffectsCanvases();

  // For single LOCAL participant (waiting for peer), center character in box
  if (allParticipants.length === 1 && allParticipants[0].isLocal && faces.length > 0) {
    let face = faces[0];
    let faceData = allParticipants[0].data;

    // Get the participant box position
    let box1 = document.getElementById('participant-1');
    if (box1) {
      let rect = box1.getBoundingClientRect();
      let boxCenterX = rect.left + rect.width / 2;
      let boxCenterY = rect.top + rect.height / 2;

      // Draw character on main canvas FIRST (this sets window.browRaiseAmount and window.mouthOpenRatio)
      push();
      // Move to box center
      translate(boxCenterX, boxCenterY);

      // Center the character by offsetting by face center
      translate(-faceData.faceCenterX, -faceData.faceCenterY);

      // Calculate distance-based scale
      let distanceScale = faceData.distanceScale;
      let eyeScale = faceData.eyeScale;

      // Draw debug keypoints
      if (CONFIG.debug.showKeypoints) {
        drawFaceKeypoints(face);
      }

      // Draw components (these set window.browRaiseAmount and window.mouthOpenRatio)
      drawEyes(face, distanceScale);
      drawLips(face, distanceScale, eyeScale);
      drawEyebrows(face, distanceScale, eyeScale);

      pop();

      // NOW check for surprise and draw speed lines on effects canvas
      if (effectsCanvas1) {
        let browRaiseAmount = window.browRaiseAmount || 0;
        let mouthOpenRatio = window.mouthOpenRatio || 0;
        let isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

        // DEBUG: Draw a test rectangle to verify effects canvas is visible
        effectsCanvas1.fill(255, 0, 255, 50); // Semi-transparent magenta
        effectsCanvas1.noStroke();
        effectsCanvas1.rect(10, 10, 100, 100);

        if (isSurprised) {
          // Debug logging
          if (frameCount % 30 === 0) {
            console.log('🎨 Drawing speed lines on effectsCanvas1:', {
              canvasSize: `${effectsCanvas1.width}x${effectsCanvas1.height}`,
              browRaiseAmount: browRaiseAmount.toFixed(3)
            });
          }
          // Draw speed lines centered in effects canvas
          drawSpeedLines(browRaiseAmount, effectsCanvas1.width / 2, effectsCanvas1.height / 2, effectsCanvas1);
        }
      } else {
        console.warn('⚠️ effectsCanvas1 not found!');
      }
    }

    return;
  }

  // Calculate grid positions (2x2 layout)
  let gridPositions = calculateGridPositions(allParticipants.length);

  // Draw grid borders
  drawGridBorders(allParticipants.length);

  // Render each character with effects on separate canvases
  allParticipants.forEach((participant, index) => {
    let pos = gridPositions[index];
    let effectsCanvas = index === 0 ? effectsCanvas1 : effectsCanvas2;

    // Draw character on main canvas FIRST
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

    // Render this character (this sets window.browRaiseAmount for local participant)
    // Only pass the face object to LOCAL participant
    let faceObj = (participant.isLocal && faces.length > 0) ? faces[0] : null;
    renderCharacter(participant.data, participant.isLocal, faceObj, false);

    // Optional: Show participant ID for debugging
    if (CONFIG.debug.showParticipantIds) {
      fill(255, 255, 0);
      noStroke();
      textSize(12);
      textAlign(CENTER, TOP);
      text(participant.isLocal ? 'YOU' : participant.id.slice(0, 6), 0, -200);
    }

    pop();

    // NOW draw speed lines on effects canvas (after character is drawn)
    if (effectsCanvas && participant.data) {
      // For local participant, use window globals (just calculated by drawing components)
      // For remote participant, use transmitted data
      let browRaiseAmount = participant.isLocal ? (window.browRaiseAmount || 0) : (participant.data.browRaiseAmount || 0);
      let mouthOpenRatio = participant.isLocal ? (window.mouthOpenRatio || 0) : (participant.data.mouthOpenRatio || 0);
      let isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

      if (isSurprised) {
        // Draw speed lines centered in effects canvas
        drawSpeedLines(browRaiseAmount, effectsCanvas.width / 2, effectsCanvas.height / 2, effectsCanvas);
      }
    }
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
 * @param {boolean} skipSpeedLines - If true, skip speed line drawing (default false)
 */
function renderCharacter(faceData, isLocal, face, skipSpeedLines = false) {
  if (!faceData) return;

  // For local character, we have the full face object
  // For remote characters, we reconstruct from transmitted data

  if (isLocal && face) {
    // Use original rendering logic for local character

    // Calculate scales
    let distanceScale = faceData.distanceScale;
    let eyeScale = faceData.eyeScale;

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

    let distanceScale = faceData.distanceScale || 1;
    let eyeScale = faceData.eyeScale || 1;

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
