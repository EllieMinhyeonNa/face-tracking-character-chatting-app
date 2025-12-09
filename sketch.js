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
    canvasElement1.style.display = 'block'; // CRITICAL: Override p5's display:none!
    canvasElement1.style.position = 'absolute';
    canvasElement1.style.top = '0';
    canvasElement1.style.left = '0';
    canvasElement1.style.width = '100%';
    canvasElement1.style.height = '100%';
    canvasElement1.style.pointerEvents = 'none';
    canvasElement1.style.zIndex = '5'; // Above main canvas but below labels
    box1.appendChild(canvasElement1);
  }

  if (box2 && !effectsCanvas2) {
    // CRITICAL: Ensure parent has position relative so absolute canvas stays inside
    box2.style.position = 'relative';

    let rect = box2.getBoundingClientRect();

    // Check if box2 is actually visible (has non-zero dimensions)
    if (rect.width === 0 || rect.height === 0) {
      return; // Skip creation if box is hidden
    }

    effectsCanvas2 = createGraphics(rect.width, rect.height);

    let canvasElement2 = effectsCanvas2.canvas;
    canvasElement2.style.display = 'block'; // CRITICAL: Override p5's display:none!
    canvasElement2.style.position = 'absolute';
    canvasElement2.style.top = '0';
    canvasElement2.style.left = '0';
    canvasElement2.style.width = '100%';
    canvasElement2.style.height = '100%';
    canvasElement2.style.pointerEvents = 'none';
    canvasElement2.style.zIndex = '5'; // Above main canvas but below labels
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
  // ALWAYS: Host on left (participant-1), Guest on right (participant-2)
  let allParticipants = [];

  // Determine roles: if I'm the host, I go first. If I'm a guest, remote goes first.
  let amIHost = isHostRole(); // Check if current device is the host

  if (amIHost) {
    // I'm the host - I go in participant-1 (left)
    if (myFaceData) {
      allParticipants.push({
        id: 'host',
        data: myFaceData,
        isLocal: true,
        isHost: true,
        boxId: 'participant-1'
      });
    }

    // Remote peer goes in participant-2 (right)
    let remoteFaceData = getRemoteFaceData();
    if (remoteFaceData) {
      allParticipants.push({
        id: 'guest',
        data: remoteFaceData,
        isLocal: false,
        isHost: false,
        boxId: 'participant-2'
      });
    }
  } else {
    // I'm a guest - host goes in participant-1 (left), I go in participant-2 (right)
    let remoteFaceData = getRemoteFaceData();
    if (remoteFaceData) {
      allParticipants.push({
        id: 'host',
        data: remoteFaceData,
        isLocal: false,
        isHost: true,
        boxId: 'participant-1'
      });
    }

    if (myFaceData) {
      allParticipants.push({
        id: 'guest',
        data: myFaceData,
        isLocal: true,
        isHost: false,
        boxId: 'participant-2'
      });
    }
  }

  // Update UI to show/hide second participant
  let connected = isConnected();
  if (typeof updateConnectionUI === 'function') {
    updateConnectionUI(connected);
  }

  // Ensure effects canvases exist (must run AFTER updateConnectionUI shows participant-2)
  // Use setTimeout to let the DOM update first
  if (connected && !effectsCanvas2) {
    setTimeout(() => {
      setupEffectsCanvases();
    }, 100); // Give DOM time to update
  } else {
    setupEffectsCanvases();
  }

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

      // Determine lip color based on role
      let isHost = allParticipants[0].isHost;
      let lipColor = isHost ? [210, 45, 45] : [101, 43, 178];

      // Draw debug keypoints (disabled when waiting alone)
      // Keypoints are only shown when explicitly enabled AND not connected
      if (CONFIG.debug.showKeypoints && !connected) {
        drawFaceKeypoints(face);
      }

      // Draw components (these set window.browRaiseAmount and window.mouthOpenRatio)
      drawEyes(face, distanceScale);
      drawLips(face, distanceScale, eyeScale, lipColor);
      drawEyebrows(face, distanceScale, eyeScale);

      pop();

      // Process all effects using the effect manager
      if (effectsCanvas1) {
        let expressionData = {
          browRaiseAmount: window.browRaiseAmount || 0,
          mouthOpenRatio: window.mouthOpenRatio || 0,
          mouthCurveAmount: window.mouthCurveAmount || 0
        };

        effectManager.processEffects(
          expressionData,
          effectsCanvas1.width / 2,
          effectsCanvas1.height / 2,
          effectsCanvas1
        );
      }
    }

    return;
  }

  // Calculate grid positions
  // When connected, ALWAYS use 2-person layout to keep positions stable
  let useStableLayout = connected; // Use 2-person layout if connected
  let gridPositions = useStableLayout
    ? calculateGridPositions(2) // Always 2-person layout when connected
    : calculateGridPositions(allParticipants.length);

  // Draw grid borders
  drawGridBorders(useStableLayout ? 2 : allParticipants.length);

  // Render each character with effects on separate canvases
  allParticipants.forEach((participant, index) => {
    // Use position based on participant's box assignment, not array index
    let positionIndex = participant.boxId === 'participant-1' ? 0 : 1;
    let pos = gridPositions[positionIndex];
    let effectsCanvas = positionIndex === 0 ? effectsCanvas1 : effectsCanvas2;

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
    renderCharacter(participant.data, participant.isLocal, faceObj, participant.isHost);

    // Optional: Show participant ID for debugging
    if (CONFIG.debug.showParticipantIds) {
      fill(255, 255, 0);
      noStroke();
      textSize(12);
      textAlign(CENTER, TOP);
      text(participant.isLocal ? 'YOU' : participant.id.slice(0, 6), 0, -200);
    }

    pop();

    // Process all effects using the effect manager
    if (effectsCanvas && participant.data) {
      // Build expression data from local or remote participant
      let expressionData = {
        browRaiseAmount: participant.isLocal ? (window.browRaiseAmount || 0) : (participant.data.browRaiseAmount || 0),
        mouthOpenRatio: participant.isLocal ? (window.mouthOpenRatio || 0) : (participant.data.mouthOpenRatio || 0),
        mouthCurveAmount: participant.isLocal ? (window.mouthCurveAmount || 0) : (participant.data.mouthCurveAmount || 0)
      };

      effectManager.processEffects(
        expressionData,
        effectsCanvas.width / 2,
        effectsCanvas.height / 2,
        effectsCanvas
      );
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
 * @param {boolean} isHost - Whether this character is the host
 */
function renderCharacter(faceData, isLocal, face, isHost = true) {
  if (!faceData) return;

  // Define colors based on role
  let lipColor = isHost ? [210, 45, 45] : [101, 43, 178]; // Red for host, purple for guest

  // For local character, we have the full face object
  // For remote characters, we reconstruct from transmitted data

  if (isLocal && face) {
    // Use original rendering logic for local character

    // Calculate scales
    let distanceScale = faceData.distanceScale;
    let eyeScale = faceData.eyeScale;

    // Draw debug keypoints (disabled when connected)
    // Only show keypoints when explicitly enabled AND user is alone (not connected)
    let connected = isConnected();
    if (CONFIG.debug.showKeypoints && !connected) {
      drawFaceKeypoints(face);
    }

    // Draw components with role-based colors
    drawEyes(face, distanceScale);
    drawLips(face, distanceScale, eyeScale, lipColor);
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

    // Draw components using existing functions with role-based colors!
    drawEyes(remoteFace, distanceScale);
    drawLips(remoteFace, distanceScale, eyeScale, lipColor);
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

/**
 * Check if this device is the host
 * @returns {boolean} true if host, false if guest
 */
function isHostRole() {
  // Check if we're the host (defined in networking-peer.js)
  return typeof isHost !== 'undefined' && isHost;
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
