// PeerJS networking - simple P2P connection for 2 people
// Person 1 creates a room, Person 2 joins with the room code

let peer = null;
let connection = null;
let remoteFaceData = null;
let myPeerId = null;
let isHost = false;

/**
 * Initialize PeerJS connection
 */
function initNetworking() {
  // Check if there's a room code in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');

  if (roomCode) {
    // Join existing room
    joinRoom(roomCode);
  } else {
    // Create new room
    createRoom();
  }
}

/**
 * Create a new room (Person 1)
 */
function createRoom() {
  peer = new Peer(); // PeerJS generates a random ID
  isHost = true;

  peer.on('open', (id) => {
    myPeerId = id;
    console.log('🎉 Room created! Your peer ID:', id);
    console.log('📋 Share this URL with your friend:');
    console.log(`   ${window.location.origin}${window.location.pathname}?room=${id}`);

    // Show room code on screen
    showRoomCode(id);
  });

  peer.on('connection', (conn) => {
    console.log('👋 Someone joined!');
    connection = conn;
    setupConnection();
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
  });
}

/**
 * Join an existing room (Person 2)
 */
function joinRoom(roomCode) {
  peer = new Peer(); // PeerJS generates our ID
  isHost = false;

  peer.on('open', (id) => {
    myPeerId = id;
    console.log('🔗 Connecting to room:', roomCode);

    // Connect to the host
    connection = peer.connect(roomCode);
    setupConnection();
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    alert('Failed to connect! Check the room code.');
  });
}

/**
 * Setup connection event handlers
 */
function setupConnection() {
  console.log('⏳ Setting up connection...', connection);

  connection.on('open', () => {
    console.log('✅ Connected to peer!');
    console.log('   My peer ID:', myPeerId);
    console.log('   Remote peer ID:', connection.peer);
    console.log('   Connection object:', connection);
    hideRoomCode();
  });

  connection.on('data', (data) => {
    // Receive remote face data
    if (frameCount % 60 === 0) {
      console.log('📥 Receiving data from peer (logging every 60 frames)');
    }
    // Stamp with local receive time to avoid clock sync issues
    if (data) {
      remoteFaceData = { ...data, receivedAt: Date.now() };
    } else {
      remoteFaceData = data; // null means no face detected
    }
  });

  connection.on('close', () => {
    console.log('❌ Peer disconnected');
    remoteFaceData = null;
    connection = null;
    if (isHost) {
      showRoomCode(myPeerId); // Show room code again if host
    }
  });

  connection.on('error', (err) => {
    console.error('❌ Connection error:', err);
    console.error('   Error type:', err.type);
    console.error('   Connection state:', connection);
  });
}

/**
 * Extract essential face data to send over network
 * @param {object} face - ml5 face mesh result
 * @returns {object} Compact face data for transmission
 */
function extractFaceData(face) {
  if (!face || !face.keypoints) return null;

  // === ESSENTIAL KEYPOINTS FOR REMOTE RENDERING ===
  // Send only ~50 keypoints instead of 468 (90% reduction!)
  let essentialKeypoints = {};

  // Helper to extract a keypoint
  function addPoint(name, index) {
    let pt = face.keypoints[index];
    essentialKeypoints[name] = { x: pt.x, y: pt.y };
  }

  // Helper to extract array of keypoints
  function addPointArray(name, indices) {
    essentialKeypoints[name] = indices.map(i => {
      let pt = face.keypoints[i];
      return { x: pt.x, y: pt.y };
    });
  }

  // Face structure (4 points)
  addPoint('NOSE_BRIDGE', KEYPOINTS.NOSE_BRIDGE);
  addPoint('NOSE_TIP', KEYPOINTS.NOSE_TIP);
  addPoint('LEFT_FACE_EDGE', KEYPOINTS.LEFT_FACE_EDGE);
  addPoint('RIGHT_FACE_EDGE', KEYPOINTS.RIGHT_FACE_EDGE);

  // Eyes (10 points)
  addPoint('LEFT_PUPIL', KEYPOINTS.LEFT_PUPIL);
  addPoint('LEFT_EYE_LEFT_CORNER', KEYPOINTS.LEFT_EYE_LEFT_CORNER);
  addPoint('LEFT_EYE_RIGHT_CORNER', KEYPOINTS.LEFT_EYE_RIGHT_CORNER);
  addPoint('LEFT_EYE_TOP', KEYPOINTS.LEFT_EYE_TOP);
  addPoint('LEFT_EYE_BOTTOM', KEYPOINTS.LEFT_EYE_BOTTOM);

  addPoint('RIGHT_PUPIL', KEYPOINTS.RIGHT_PUPIL);
  addPoint('RIGHT_EYE_LEFT_CORNER', KEYPOINTS.RIGHT_EYE_LEFT_CORNER);
  addPoint('RIGHT_EYE_RIGHT_CORNER', KEYPOINTS.RIGHT_EYE_RIGHT_CORNER);
  addPoint('RIGHT_EYE_TOP', KEYPOINTS.RIGHT_EYE_TOP);
  addPoint('RIGHT_EYE_BOTTOM', KEYPOINTS.RIGHT_EYE_BOTTOM);

  // Eyebrows (20 points)
  addPointArray('EYEBROW_LEFT_TOP_ROW', KEYPOINTS.EYEBROW_LEFT_TOP_ROW);
  addPointArray('EYEBROW_LEFT_BOTTOM_ROW', KEYPOINTS.EYEBROW_LEFT_BOTTOM_ROW);
  addPointArray('EYEBROW_RIGHT_TOP_ROW', KEYPOINTS.EYEBROW_RIGHT_TOP_ROW);
  addPointArray('EYEBROW_RIGHT_BOTTOM_ROW', KEYPOINTS.EYEBROW_RIGHT_BOTTOM_ROW);

  // Lips (4 basic + 10 for smooth curves)
  addPoint('LIP_LEFT_CORNER', KEYPOINTS.LIP_LEFT_CORNER);
  addPoint('LIP_RIGHT_CORNER', KEYPOINTS.LIP_RIGHT_CORNER);
  addPoint('LIP_TOP_CENTER', KEYPOINTS.LIP_TOP_CENTER);
  addPoint('LIP_BOTTOM_CENTER', KEYPOINTS.LIP_BOTTOM_CENTER);

  // Smooth closed mouth curve points
  addPointArray('LIP_SMOOTH_UPPER', [61, 39, 0, 269, 291]);
  addPointArray('LIP_SMOOTH_LOWER', [61, 181, 17, 405, 291]);

  // Open mouth inner contour
  addPointArray('LIP_UPPER_INNER', [78, 81, 13, 311, 308]);
  addPointArray('LIP_LOWER_INNER', [78, 178, 14, 402, 308]);

  // Calculate metrics
  let noseBridge = face.keypoints[KEYPOINTS.NOSE_BRIDGE];
  let leftFaceEdge = face.keypoints[KEYPOINTS.LEFT_FACE_EDGE];
  let rightFaceEdge = face.keypoints[KEYPOINTS.RIGHT_FACE_EDGE];
  let faceWidth = dist(leftFaceEdge.x, leftFaceEdge.y, rightFaceEdge.x, rightFaceEdge.y);
  let distanceScale = faceWidth / CONFIG.distance.baseFaceWidth;
  let eyeScale = constrain(distanceScale, CONFIG.eyes.minScale, CONFIG.eyes.maxScale);

  // Expression data
  let browRaiseAmount = window.browRaiseAmount || 0;
  let mouthOpenRatio = window.mouthOpenRatio || 0;
  let mouthCurveAmount = window.mouthCurveAmount || 0;

  return {
    // Essential keypoints for full-quality remote rendering
    keypoints: essentialKeypoints,

    // Face center for positioning
    faceCenterX: noseBridge.x,
    faceCenterY: noseBridge.y,

    // Scale
    distanceScale: distanceScale,
    eyeScale: eyeScale,

    // Expression
    browRaiseAmount: browRaiseAmount,
    mouthOpenRatio: mouthOpenRatio,
    mouthCurveAmount: mouthCurveAmount,

    // Timestamp
    timestamp: Date.now()
  };
}

/**
 * Send face data to peer
 */
function sendFaceData(faceData) {
  if (connection && connection.open) {
    connection.send(faceData);
  }
}

/**
 * Get remote participant's face data
 * Returns null if data is too old (>500ms since received)
 */
function getRemoteFaceData() {
  if (!remoteFaceData) return null;

  // Check if data is stale using receivedAt (local receive time)
  // This avoids clock synchronization issues between devices
  const MAX_AGE_MS = 500;
  const age = Date.now() - remoteFaceData.receivedAt;

  if (age > MAX_AGE_MS) {
    // Data is too old, probably no face detected on remote side
    return null;
  }

  return remoteFaceData;
}

/**
 * Check if connected to peer
 */
function isConnected() {
  return connection && connection.open;
}

/**
 * Show room code on screen (small toggle button in top corner)
 */
function showRoomCode(code) {
  // Remove old full-screen overlay if it exists
  let oldOverlay = document.getElementById('room-code-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  // Create small toggle button
  let toggleBtn = document.getElementById('room-code-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'room-code-toggle';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border: none;
      padding: 12px 20px;
      margin: 16px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.2s;
    `;
    toggleBtn.textContent = '📋 Show Room Code';
    document.body.appendChild(toggleBtn);

    // Create popup panel (hidden by default)
    let popup = document.createElement('div');
    popup.id = 'room-code-popup';
    popup.style.cssText = `
      position: fixed;
      top: 70px;
      right: 16px;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 20px;
      border-radius: 16px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      display: none;
      max-width: 350px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    const shortCode = code.slice(0, 8);
    const localUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    const phoneUrl = `https://192.168.0.229:8080/?room=${code}`;

    popup.innerHTML = `
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Waiting for partner...</div>
      <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Share this code:</div>
      <div style="background: #333; padding: 15px; border-radius: 8px; font-size: 28px; letter-spacing: 4px; text-align: center; margin-bottom: 12px;">
        ${shortCode}
      </div>
      <div style="font-size: 10px; color: #999; margin-bottom: 4px;">On this laptop:</div>
      <div style="background: #222; padding: 8px; border-radius: 6px; font-size: 10px; word-break: break-all; margin-bottom: 8px;">
        ${localUrl}
      </div>
      <div style="font-size: 10px; color: #999; margin-bottom: 4px;">On phone/other device:</div>
      <div style="background: #222; padding: 8px; border-radius: 6px; font-size: 10px; word-break: break-all;">
        ${phoneUrl}
      </div>
    `;
    document.body.appendChild(popup);

    // Toggle popup on button click
    let isOpen = false;
    toggleBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      popup.style.display = isOpen ? 'block' : 'none';
      toggleBtn.textContent = isOpen ? '✕ Hide' : '📋 Show Room Code';
      toggleBtn.style.background = isOpen ? 'rgba(255, 74, 74, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      toggleBtn.style.color = isOpen ? 'white' : '#333';
    });
  }
}

/**
 * Hide room code button (when connected)
 */
function hideRoomCode() {
  const toggleBtn = document.getElementById('room-code-toggle');
  const popup = document.getElementById('room-code-popup');

  if (toggleBtn) {
    toggleBtn.remove();
  }
  if (popup) {
    popup.remove();
  }
}
