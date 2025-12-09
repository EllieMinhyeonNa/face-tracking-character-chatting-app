// Main sketch file - orchestrates face tracking and rendering
// Now with per-participant canvas support for effects!

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

// Separate canvases for character rendering - one per participant
let characterCanvas1 = null;
let characterCanvas2 = null;

// Separate canvases for effects (speed lines) - one per participant
let effectsCanvas1 = null;
let effectsCanvas2 = null;

// Debug overlays per participant (DOM elements)
let debugOverlays = new Map();

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  // No main canvas needed - we'll use per-participant canvases
  noCanvas(); // Disable default p5 canvas

  video = createCapture(VIDEO, () => {
    console.log('📹 Camera initialized successfully');
    console.log('   Video dimensions:', video.width, 'x', video.height);
  });
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  // Initialize networking
  initNetworking();

  // Create canvases for both character and effects
  setupCanvases();
}

/**
 * Create separate canvases for each participant (character + effects)
 */
function setupCanvases() {
  setupCanvasForParticipant('participant-1');
  setupCanvasForParticipant('participant-2');
}

/**
 * Helper to create both character and effects canvas for a participant box
 */
function setupCanvasForParticipant(boxId) {
  let box = document.getElementById(boxId);
  if (!box) return;

  // Ensure parent has position relative
  box.style.position = 'relative';

  let rect = box.getBoundingClientRect();

  // Skip if box is hidden (has no dimensions)
  if (rect.width === 0 || rect.height === 0) {
    return;
  }

  let isParticipant1 = boxId === 'participant-1';

  // Create character canvas (z-index: 1 - base layer for character)
  if (isParticipant1 && !characterCanvas1) {
    characterCanvas1 = createGraphics(rect.width, rect.height);
    appendCanvas(characterCanvas1.canvas, box, '1');
  } else if (!isParticipant1 && !characterCanvas2) {
    characterCanvas2 = createGraphics(rect.width, rect.height);
    appendCanvas(characterCanvas2.canvas, box, '1');
  }

  // Create effects canvas (z-index: 5 - above character)
  if (isParticipant1 && !effectsCanvas1) {
    effectsCanvas1 = createGraphics(rect.width, rect.height);
    appendCanvas(effectsCanvas1.canvas, box, '5');
  } else if (!isParticipant1 && !effectsCanvas2) {
    effectsCanvas2 = createGraphics(rect.width, rect.height);
    appendCanvas(effectsCanvas2.canvas, box, '5');
  }
}

/**
 * Helper to append canvas to participant box with proper styling
 */
function appendCanvas(canvasElement, parentBox, zIndex) {
  canvasElement.style.display = 'block';
  canvasElement.style.position = 'absolute';
  canvasElement.style.top = '0';
  canvasElement.style.left = '0';
  canvasElement.style.width = '100%';
  canvasElement.style.height = '100%';
  canvasElement.style.pointerEvents = 'none';
  canvasElement.style.zIndex = zIndex;
  parentBox.appendChild(canvasElement);
}

// Handle window resize
function windowResized() {
  // Recreate all canvases
  if (characterCanvas1) {
    characterCanvas1.remove();
    characterCanvas1 = null;
  }
  if (characterCanvas2) {
    characterCanvas2.remove();
    characterCanvas2 = null;
  }
  if (effectsCanvas1) {
    effectsCanvas1.remove();
    effectsCanvas1 = null;
  }
  if (effectsCanvas2) {
    effectsCanvas2.remove();
    effectsCanvas2 = null;
  }
  setupCanvases();
}

function draw() {
  try {
    // Clear all canvases
    if (characterCanvas1) characterCanvas1.clear();
    if (characterCanvas2) characterCanvas2.clear();
    if (effectsCanvas1) effectsCanvas1.clear();
    if (effectsCanvas2) effectsCanvas2.clear();

    // === MY CHARACTER (from local webcam) ===
    let myFaceData = null;

    if (faces.length > 0) {
      let face = faces[0];

      // Extract face data for networking
      myFaceData = extractFaceData(face);

      // Send to peer
      if (frameCount % 60 === 0) {
        console.log('📤 Sending face data to peer');
      }
      sendFaceData(myFaceData);
    } else {
      // No face detected - send null to clear remote character
      sendFaceData(null);
    }

  // === RENDER ALL CHARACTERS (me + remote peer) ===
  // ALWAYS: Host on left (participant-1), Guest on right (participant-2)
  let allParticipants = [];

  // Debug: Check remote data availability (every 60 frames)
  let remoteFaceDataDebug = getRemoteFaceData();
  if (frameCount % 60 === 0) {
    console.log('🔍 Remote data check:', remoteFaceDataDebug ? 'RECEIVED' : 'NONE');
    if (remoteFaceDataDebug) {
      console.log('   Remote has', remoteFaceDataDebug.browRaiseAmount ? 'expression data' : 'NO expression data');
    }
  }

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

  // Debug: Log participants array
  if (frameCount % 60 === 0) {
    console.log('👥 Participants:', allParticipants.length,
      allParticipants.map(p => `${p.id}(${p.boxId})`).join(', '));
  }

  // Ensure canvases exist (must run AFTER updateConnectionUI shows participant-2)
  // Use setTimeout to let the DOM update first
  if (connected && (!characterCanvas2 || !effectsCanvas2)) {
    setTimeout(() => {
      setupCanvases();
    }, 100); // Give DOM time to update
  } else {
    setupCanvases();
  }

  // === FIRST PASS: Render all characters and capture expression data ===
  let participantExpressions = new Map(); // Store each participant's expression separately

  allParticipants.forEach((participant) => {
    // Get the character canvas for this participant
    let characterCanvas = participant.boxId === 'participant-1' ? characterCanvas1 : characterCanvas2;

    if (!characterCanvas) return;

    let faceData = participant.data;
    if (!faceData) return;

    // Draw character centered in their canvas
    characterCanvas.push();

    // Center in canvas
    characterCanvas.translate(characterCanvas.width / 2, characterCanvas.height / 2);

    // Center the character by offsetting by face center
    characterCanvas.translate(-faceData.faceCenterX, -faceData.faceCenterY);

    // Get the full face object if this is the local participant
    let faceObj = (participant.isLocal && faces.length > 0) ? faces[0] : null;

    // Render character (this sets window.browRaiseAmount/mouthOpenRatio for local participant)
    renderCharacterOnCanvas(characterCanvas, faceData, participant.isLocal, faceObj, participant.isHost, connected);

    characterCanvas.pop();

    // IMMEDIATELY capture expression data after rendering THIS participant
    if (participant.isLocal) {
      // Local participant - use the transmitted face data we already calculated
      // This ensures we get the correct values that were calculated in extractFaceData()
      let localExpression = {
        browRaiseAmount: faceData.browRaiseAmount || 0,
        mouthOpenRatio: faceData.mouthOpenRatio || 0,
        mouthCurveAmount: faceData.mouthCurveAmount || 0,
        leftEyeOpenRatio: faceData.leftEyeOpenRatio || 1,
        rightEyeOpenRatio: faceData.rightEyeOpenRatio || 1
      };
      participantExpressions.set(participant.boxId, localExpression);

      // Debug: Log local expression (every 60 frames)
      if (frameCount % 60 === 0) {
        console.log(`📊 Local ${participant.id} (${participant.boxId}) expression:`, {
          brow: localExpression.browRaiseAmount.toFixed(3),
          mouth: localExpression.mouthOpenRatio.toFixed(3),
          curve: localExpression.mouthCurveAmount.toFixed(3),
          eyeL: localExpression.leftEyeOpenRatio.toFixed(3),
          eyeR: localExpression.rightEyeOpenRatio.toFixed(3)
        });
      }
    } else {
      // Remote participant - use transmitted data
      let remoteExpression = {
        browRaiseAmount: faceData.browRaiseAmount || 0,
        mouthOpenRatio: faceData.mouthOpenRatio || 0,
        mouthCurveAmount: faceData.mouthCurveAmount || 0,
        leftEyeOpenRatio: faceData.leftEyeOpenRatio || 1,
        rightEyeOpenRatio: faceData.rightEyeOpenRatio || 1
      };
      participantExpressions.set(participant.boxId, remoteExpression);

      // Debug: Log remote expression (every 60 frames)
      if (frameCount % 60 === 0) {
        console.log(`📊 Remote ${participant.id} (${participant.boxId}) expression:`, {
          brow: remoteExpression.browRaiseAmount.toFixed(3),
          mouth: remoteExpression.mouthOpenRatio.toFixed(3),
          curve: remoteExpression.mouthCurveAmount.toFixed(3),
          eyeL: remoteExpression.leftEyeOpenRatio.toFixed(3),
          eyeR: remoteExpression.rightEyeOpenRatio.toFixed(3)
        });
      }
    }
  });

  // === SECOND PASS: Apply effects using captured expression data ===
  allParticipants.forEach((participant) => {
    let effectsCanvas = participant.boxId === 'participant-1' ? effectsCanvas1 : effectsCanvas2;

    if (!effectsCanvas) return;
    if (!participant.data) return;

    // Get the stored expression data for THIS participant
    let expressionData = participantExpressions.get(participant.boxId);
    if (!expressionData) return;

    // Debug: Log which canvas we're processing effects for
    if (frameCount % 60 === 0) {
      console.log(`🎨 Processing effects for ${participant.id} on ${participant.boxId}`, {
        brow: expressionData.browRaiseAmount.toFixed(3),
        mouth: expressionData.mouthOpenRatio.toFixed(3)
      });
    }

    // Apply effects for this participant
    effectManager.processEffects(
      expressionData,
      effectsCanvas.width / 2,
      effectsCanvas.height / 2,
      effectsCanvas
    );
  });

  // === DEBUG OVERLAY: Show expression values under labels ===
  updateDebugOverlays(allParticipants, participantExpressions);

  } catch (error) {
    console.error('❌ Draw error:', error);
    // Don't crash - just log the error and continue
  }
}

/**
 * Create or update small debug panels under host/guest tags
 */
function updateDebugOverlays(participants, expressions) {
  // Build a quick lookup of participants by box
  let byBox = new Map();
  participants.forEach(p => byBox.set(p.boxId, p));

  ['participant-1', 'participant-2'].forEach((boxId) => {
    let overlay = getOrCreateDebugOverlay(boxId);
    if (!overlay) return;

    let expr = expressions.get(boxId);
    let participant = byBox.get(boxId);

    if (!participant || !expr) {
      overlay.textContent = 'no data';
      overlay.style.opacity = '0.5';
      return;
    }

    overlay.style.opacity = '1';
    overlay.textContent = [
      `brow: ${expr.browRaiseAmount.toFixed(2)}`,
      `mouth: ${expr.mouthOpenRatio.toFixed(2)}`,
      `curve: ${expr.mouthCurveAmount.toFixed(2)}`,
      `eyeL: ${expr.leftEyeOpenRatio.toFixed(2)}`,
      `eyeR: ${expr.rightEyeOpenRatio.toFixed(2)}`
    ].join('  |  ');
  });
}

function getOrCreateDebugOverlay(boxId) {
  if (debugOverlays.has(boxId)) return debugOverlays.get(boxId);

  let box = document.getElementById(boxId);
  if (!box) return null;

  let overlay = document.createElement('div');
  overlay.className = 'debug-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '52px'; // under the host/guest pill
  overlay.style.left = '16px';
  overlay.style.right = '16px';
  overlay.style.padding = '8px 10px';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  overlay.style.color = '#fff';
  overlay.style.fontSize = '12px';
  overlay.style.fontFamily = "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace";
  overlay.style.borderRadius = '10px';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '9';

  box.appendChild(overlay);
  debugOverlays.set(boxId, overlay);
  return overlay;
}

/**
 * Render a character on a specific canvas
 * @param {object} canvas - p5.Graphics canvas to draw on
 * @param {object} faceData - Face data (local or remote)
 * @param {boolean} isLocal - Whether this is the local user
 * @param {object} face - Full face object (only for local)
 * @param {boolean} isHost - Whether this character is the host
 * @param {boolean} connected - Whether user is connected to peer
 */
function renderCharacterOnCanvas(canvas, faceData, isLocal, face, isHost, connected) {
  if (!faceData) return;

  // Define colors based on role
  let lipColor = isHost ? [210, 45, 45] : [101, 43, 178]; // Red for host, purple for guest

  if (isLocal && face) {
    // Local character - use full face object
    let distanceScale = faceData.distanceScale;
    let eyeScale = faceData.eyeScale;

    // Draw debug keypoints (only when explicitly enabled AND not connected)
    if (CONFIG.debug.showKeypoints && !connected) {
      drawFaceKeypointsOnCanvas(canvas, face);
    }

    // Draw components on the canvas
    drawEyesOnCanvas(canvas, face, distanceScale);
    drawLipsOnCanvas(canvas, face, distanceScale, eyeScale, lipColor);
    drawEyebrowsOnCanvas(canvas, face, distanceScale, eyeScale);

  } else {
    // Remote character - reconstruct from transmitted essential keypoints
    if (!faceData.keypoints) {
      canvas.push();
      canvas.fill(150);
      canvas.noStroke();
      canvas.textSize(16);
      canvas.textAlign(CENTER, CENTER);
      canvas.text('Remote\nCharacter', 0, 0);
      canvas.pop();
      return;
    }

    // Reconstruct a "fake face object" with the essential keypoints
    let remoteFace = reconstructFaceFromKeypoints(faceData.keypoints);
    let distanceScale = faceData.distanceScale || 1;
    let eyeScale = faceData.eyeScale || 1;

    // Draw components on the canvas
    drawEyesOnCanvas(canvas, remoteFace, distanceScale);
    drawLipsOnCanvas(canvas, remoteFace, distanceScale, eyeScale, lipColor);
    drawEyebrowsOnCanvas(canvas, remoteFace, distanceScale, eyeScale);
  }
}

/**
 * DEPRECATED: Old function for rendering on main canvas
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
// Grid functions removed - now using per-participant canvases

function gotFaces(results) {
  faces = results;

  // Debug: Log face detection with more details
  if (frameCount % 60 === 0) { // Log every 60 frames (once per second)
    console.log('Face detection:', faces.length, 'faces detected');
    if (faces.length > 0) {
      console.log('   First face has', faces[0].keypoints.length, 'keypoints');
    }
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

// === CANVAS WRAPPER FUNCTIONS ===
// These allow component functions to draw on specific canvases
// We temporarily redirect p5 drawing functions to the canvas

function withCanvasContext(canvas, fn) {
  // Store original p5 drawing functions
  let originals = {
    fill: window.fill,
    stroke: window.stroke,
    strokeWeight: window.strokeWeight,
    noStroke: window.noStroke,
    noFill: window.noFill,
    circle: window.circle,
    ellipse: window.ellipse,
    push: window.push,
    pop: window.pop,
    translate: window.translate,
    rotate: window.rotate,
    beginShape: window.beginShape,
    endShape: window.endShape,
    vertex: window.vertex,
    bezierVertex: window.bezierVertex,
    curveVertex: window.curveVertex
  };

  // Override with canvas methods (bind to canvas context)
  window.fill = canvas.fill.bind(canvas);
  window.stroke = canvas.stroke.bind(canvas);
  window.strokeWeight = canvas.strokeWeight.bind(canvas);
  window.noStroke = canvas.noStroke.bind(canvas);
  window.noFill = canvas.noFill.bind(canvas);
  window.circle = canvas.circle.bind(canvas);
  window.ellipse = canvas.ellipse.bind(canvas);
  window.push = canvas.push.bind(canvas);
  window.pop = canvas.pop.bind(canvas);
  window.translate = canvas.translate.bind(canvas);
  window.rotate = canvas.rotate.bind(canvas);
  window.beginShape = canvas.beginShape.bind(canvas);
  window.endShape = canvas.endShape.bind(canvas);
  window.vertex = canvas.vertex.bind(canvas);
  window.bezierVertex = canvas.bezierVertex.bind(canvas);
  window.curveVertex = canvas.curveVertex.bind(canvas);

  // Call the function
  let result = fn();

  // Restore original functions
  window.fill = originals.fill;
  window.stroke = originals.stroke;
  window.strokeWeight = originals.strokeWeight;
  window.noStroke = originals.noStroke;
  window.noFill = originals.noFill;
  window.circle = originals.circle;
  window.ellipse = originals.ellipse;
  window.push = originals.push;
  window.pop = originals.pop;
  window.translate = originals.translate;
  window.rotate = originals.rotate;
  window.beginShape = originals.beginShape;
  window.endShape = originals.endShape;
  window.vertex = originals.vertex;
  window.bezierVertex = originals.bezierVertex;
  window.curveVertex = originals.curveVertex;

  return result;
}

function drawEyesOnCanvas(canvas, face, distanceScale) {
  return withCanvasContext(canvas, () => drawEyes(face, distanceScale));
}

function drawLipsOnCanvas(canvas, face, distanceScale, eyeScale, lipColor) {
  return withCanvasContext(canvas, () => drawLips(face, distanceScale, eyeScale, lipColor));
}

function drawEyebrowsOnCanvas(canvas, face, distanceScale, eyeScale) {
  return withCanvasContext(canvas, () => drawEyebrows(face, distanceScale, eyeScale));
}

function drawFaceKeypointsOnCanvas(canvas, face) {
  for (let j = 0; j < face.keypoints.length; j++) {
    let keypoint = face.keypoints[j];
    canvas.fill(0, 255, 0);
    canvas.noStroke();
    canvas.circle(keypoint.x, keypoint.y, 5);

    if (CONFIG.debug.showIndices) {
      canvas.fill(255, 255, 0);
      canvas.textSize(10);
      canvas.textAlign(CENTER, CENTER);
      canvas.text(j, keypoint.x, keypoint.y - 10);
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
