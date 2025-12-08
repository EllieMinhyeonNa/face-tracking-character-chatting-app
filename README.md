# Face Tracking Character Chat

A real-time P2P face tracking application that creates cartoon-style characters for 2 people. Each person's facial movements control their character's eyes, eyebrows, and lips in real-time.

## Features

### Character Rendering
- **Exaggerated Eyes**: Large cartoon eyes with pupil tracking and blinking
- **Animated Lips**: Dynamic mouth that changes shape when talking
- **Dynamic Eyebrows**: Automatic raise detection with exaggerated movement
- **Distance Scaling**: All features scale based on camera distance
- **Face Rotation**: Components rotate naturally with head tilt

### Multi-User (P2P)
- **2-Person Support**: Connect with one friend via PeerJS
- **Room Code System**: Share a simple URL to connect
- **Real-time Sync**: Both characters update instantly
- **Side-by-side View**: Both characters displayed together
- **No Server Needed**: Direct peer-to-peer connection

### Visual Effects
- **Speed Lines**: Appear when you make a surprised expression
- **Event Detection**: Recognizes facial expressions and triggers effects

## Technologies Used

- **p5.js**: Creative coding library for canvas rendering
- **ml5.js**: Machine learning library for face mesh detection
- **MediaPipe Face Mesh**: Underlying ML model for 468+ facial landmark detection
- **PeerJS**: WebRTC peer-to-peer networking for real-time connection

## Quick Start

### Solo Testing (Single User)
1. Clone this repository
2. Start HTTPS server: `python3 https-server.py` (generates certificate if needed)
3. Open `https://localhost:8080` in your browser
4. Allow camera access
5. See your character!

### Multi-User Demo (2 People)
1. **Person 1**: Open `https://localhost:8080`
2. Copy the room URL shown on screen
3. **Person 2**: Open that URL on their device
4. Both characters appear side-by-side!

**Note**: Both devices must be on the same WiFi network. HTTPS is required for camera access on non-localhost devices.

## File Structure

```
├── index.html              # Entry point
├── sketch.js               # Main p5.js sketch
├── networking-peer.js      # PeerJS P2P networking
├── config.js               # Visual configuration
├── constants/
│   └── keypoints.js       # Face mesh keypoint indices
├── components/
│   ├── eyes.js            # Eye rendering
│   ├── lips.js            # Lip rendering
│   └── eyebrows.js        # Eyebrow rendering
├── effects/
│   ├── events.js          # Expression detection
│   └── speedlines.js      # Visual effects
├── README.md              # This file
└── ARCHITECTURE.md        # Technical documentation
```

## Architecture

The application follows a component-based architecture with centralized configuration:

```
┌────────────────────────────────────────────────────────────────┐
│                         index.html                             │
│  Loads: p5.js → ml5.js → constants → config → components → sketch│
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                    constants/keypoints.js                      │
│  • KEYPOINTS.LEFT_PUPIL, RIGHT_PUPIL                           │
│  • KEYPOINTS.EYEBROW_LEFT_TOP_ROW, etc.                        │
│  • KEYPOINTS.LIP_LEFT_CORNER, LIP_UPPER_OUTER, etc.            │
│  • Replaces magic numbers with meaningful names                │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                         config.js                              │
│  • Eyes: exaggeration, scaling, positioning                    │
│  • Lips: stroke weight, colors, thresholds                     │
│  • Eyebrows: styling, raise detection, debug settings          │
│  • Canvas: background color, video toggle                      │
│  • Debug: keypoints, indices, dynamics visibility              │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                         sketch.js                              │
│  Main Loop:                                                    │
│  1. Capture video frame                                        │
│  2. ml5.faceMesh detects face → gotFaces()                     │
│  3. Calculate distanceScale from face width                    │
│  4. Calculate eyeScale (clamped distanceScale)                 │
│  5. Render: eyes → lips → eyebrows (with raise detection)     │
│  6. Handle keyboard input (H, I, K, D, V)                      │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────┬──────────────────┬────────────────────────┐
│  eyes.js         │  lips.js         │  eyebrows.js           │
│ ────────────     │ ────────────     │ ────────────           │
│ • Rotation calc  │ • Open/closed    │ • Raise detection      │
│ • Side-by-side   │ • Smooth curves  │ • Height exaggeration  │
│ • Blinking       │ • Oval/curve     │ • Rotation-invariant   │
│ • Pupil clipping │ • Exaggeration   │ • Debug visualization  │
│ • Uses KEYPOINTS │ • Uses KEYPOINTS │ • Uses KEYPOINTS       │
└──────────────────┴──────────────────┴────────────────────────┘
```

### config.js
Central configuration file containing all adjustable parameters:
- **Eyes**: exaggerationFactor, aspectRatio, pupilSizeRatio, minScale, maxScale, verticalOffset
- **Lips**: exaggerationFactor, minScale, maxScale, strokeWeight, color, openThreshold, verticalOffset
- **Eyebrows**: strokeWeight, exaggerationFactor, color, showDebugPoints, minScale, maxScale, verticalOffset
- **Distance**: baseFaceWidth for scale calculations
- **Canvas**: backgroundColor, showVideo toggle
- **Debug**: showKeypoints, showIndices flags

### sketch.js
Main orchestrator that:
- Sets up webcam and face mesh detection
- Initializes PeerJS networking for P2P connection
- Handles both local and remote character rendering
- Calculates distance-based scaling: `faceWidth / baseFaceWidth`
- Calculates eye scale: `constrain(distanceScale, eyes.minScale, eyes.maxScale)`
- Renders components in order (keypoints → eyes → lips → eyebrows)
- Provides keyboard shortcuts and debug visualization
- Helper functions: `calculateDistanceScale()`, `drawFaceKeypoints()`, `reconstructFaceFromKeypoints()`

### networking-peer.js
PeerJS networking layer that:
- Creates or joins P2P rooms using URL parameters
- Extracts essential face data (~50 keypoints) for transmission
- Sends/receives face data in real-time
- Displays room code overlay for easy connection
- Handles connection lifecycle (open, data, close, error)

### Components Pattern
Each component follows a consistent interface:

```javascript
function drawComponent(face, distanceScale, eyeScale) {
  // 1. Apply scale constraints
  let clampedScale = constrain(distanceScale, CONFIG.component.minScale, CONFIG.component.maxScale);

  // 2. Get keypoint positions
  let point = face.keypoints[index];

  // 3. Calculate face center for exaggeration
  let faceCenterX = ...;
  let faceCenterY = ...;

  // 4. Apply exaggeration from center
  let offset = point - faceCenter;
  let exaggerated = faceCenter + (offset * exaggerationFactor * scale);

  // 5. Render with CONFIG styling
  stroke(...CONFIG.component.color);
  strokeWeight(CONFIG.component.strokeWeight * scale);
}
```

**Key Principles:**
- Self-contained: Each component handles its own rendering logic
- Config-driven: All magic numbers come from CONFIG object
- Consistent scaling: distanceScale and eyeScale passed to all components
- Exaggeration pattern: Position offset from face center multiplied by factors

## Code Overview

**sketch.js:**
- `preload()`: Initializes ml5 faceMesh model
- `setup()`: Creates canvas and starts webcam
- `draw()`: Main render loop - calculates scale and draws components
- `calculateDistanceScale()`: Determines size based on face width
- `drawFaceKeypoints()`: Debug visualization
- `keyPressed()`: Keyboard shortcuts (i, k, d)

**components/eyes.js:**
- Calculates face rotation angle
- Positions eyes side-by-side without gap/overlap
- Handles blinking animation (0-100% open)
- Clips pupils within eye boundaries
- Rotates with face tilt

**components/lips.js:**
- Detects mouth open vs closed state
- Renders smile curve when closed
- Renders oval shape when open
- Scales stroke weight with distance

**components/eyebrows.js:**
- Detects eyebrow raising via brow-to-eye distance
- Rotation-invariant detection (resistant to head tilt)
- Applies height exaggeration when eyebrows are raised
- Defines top/bottom eyebrow keypoint rows (using KEYPOINTS constants)
- Draws curve through centerline
- Optional debug visualization showing distance ratio and raise amount

**networking-peer.js:**
- `initNetworking()`: Checks URL for room code, creates or joins room
- `createRoom()`: Person 1 - generates peer ID and displays room code
- `joinRoom(roomCode)`: Person 2 - connects to host's peer ID
- `extractFaceData(face)`: Extracts ~50 essential keypoints from 468 total
- `sendFaceData(faceData)`: Transmits face data to peer
- `getRemoteFaceData()`: Returns received remote face data
- `reconstructFaceFromKeypoints(kp)`: Recreates face object from transmitted keypoints

## Keyboard Controls

- **`H`**: Show help menu (displays all keyboard shortcuts in console)
- **`I`**: Toggle keypoint index numbers on/off
- **`K`**: Toggle face mesh keypoints (green dots) visibility
- **`D`**: Toggle eyebrow debug points (red circles) on/off
- **`V`**: Toggle between video feed and solid background color
- **`P`**: Toggle participant IDs (shows "YOU" vs peer ID)

**Note**: Eyebrow dynamics debug (distance ratio, raise amount, height multiplier) is controlled by `CONFIG.eyebrows.showDynamicsDebug` in config.js

## Configuration

All visual parameters are centralized in `config.js`. Modify these values to customize appearance:

```javascript
// Eye customization
CONFIG.eyes.exaggerationFactor = 1.7;  // Eye size multiplier
CONFIG.eyes.aspectRatio = 1.2;         // Height/width when fully open
CONFIG.eyes.pupilSizeRatio = 0.2;      // Pupil size relative to eye height
CONFIG.eyes.minScale = 1.0;            // Minimum scale when far away
CONFIG.eyes.maxScale = 1.6;            // Maximum scale when close
CONFIG.eyes.verticalOffset = 30;       // Position offset (pixels)

// Lip customization
CONFIG.lips.exaggerationFactor = 1.0;  // Position exaggeration multiplier
CONFIG.lips.strokeWeight = 8;          // Lip line thickness
CONFIG.lips.openThreshold = 0.05;      // Threshold for open/closed detection
CONFIG.lips.color = [255, 0, 0];       // RGB color (red)
CONFIG.lips.verticalOffset = -10;      // Position offset (pixels)

// Eyebrow customization
CONFIG.eyebrows.exaggerationFactor = 1.0;  // Size/position exaggeration
CONFIG.eyebrows.strokeWeight = 8;          // Line thickness
CONFIG.eyebrows.color = [0, 0, 0];         // RGB color (black)
CONFIG.eyebrows.verticalOffset = 25;       // Position offset (pixels)

// Canvas settings
CONFIG.canvas.backgroundColor = [255, 74, 74];  // Background color (RGB)
CONFIG.canvas.showVideo = true;                 // Show webcam feed

// Debug settings
CONFIG.debug.showKeypoints = true;     // Show green face mesh dots
CONFIG.debug.showIndices = false;      // Show keypoint index numbers
```

## Extending the Application

The codebase is designed for easy extension following consistent patterns:

### Adding New Components (e.g., Nose, Ears)

1. **Create component file**: `components/nose.js`
   ```javascript
   function drawNose(face, distanceScale = 1, eyeScale = 1) {
     // Apply scale constraints
     let clampedScale = constrain(distanceScale, CONFIG.nose.minScale, CONFIG.nose.maxScale);

     // Get keypoints (find indices using 'I' key in debug mode)
     let noseTip = face.keypoints[1];

     // Calculate face center for exaggeration
     let faceCenterX = noseTip.x;
     let faceCenterY = noseTip.y;

     // Apply exaggeration and render
     // ... your rendering logic
   }
   ```

2. **Add configuration**: Edit `config.js`
   ```javascript
   nose: {
     exaggerationFactor: 1.5,
     minScale: 0.5,
     maxScale: 2.0,
     verticalOffset: 0,
     color: [200, 100, 100]
   }
   ```

3. **Import and render**:
   - Add `<script src="components/nose.js"></script>` in `index.html`
   - Call `drawNose(face, distanceScale, eyeScale);` in `sketch.js` draw loop

### Modifying Existing Components

All parameters are in `config.js` - no need to touch component code:
- **Change colors**: `CONFIG.lips.color = [0, 255, 0];` for green lips
- **Adjust sizes**: `CONFIG.eyes.exaggerationFactor = 2.0;` for larger eyes
- **Reposition**: `CONFIG.eyebrows.verticalOffset = -20;` to move up
- **Scale limits**: `CONFIG.lips.maxScale = 2.0;` for more dramatic distance effect

### Adding Facial Expressions

Components receive full face data with 468 keypoints:

```javascript
// Calculate smile intensity
let leftMouthCorner = face.keypoints[61];
let rightMouthCorner = face.keypoints[291];
let mouthWidth = dist(leftMouthCorner.x, leftMouthCorner.y, rightMouthCorner.x, rightMouthCorner.y);
let smileRatio = mouthWidth / faceWidth;  // Compare to face width

// Use ratio for state-based rendering
if (smileRatio > 0.45) {
  // Draw happy expression
} else {
  // Draw neutral expression
}
```

**Tips:**
- Use keyboard shortcut `I` to show keypoint indices
- Use keyboard shortcut `K` to show all face mesh points
- Reference [MediaPipe Face Mesh documentation](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection) for keypoint locations
- Follow the exaggeration pattern: `faceCenter + (offset * exaggerationFactor * scale)`

### Scaling to More People

**Current limitation**: PeerJS simple connection supports 2 people only.

To support 3+ people, you would need to:
1. **Switch networking approach**:
   - Use PeerJS mesh network (each peer connects to all others)
   - Or implement a star topology (one host, multiple clients)
   - Or switch to Socket.io server-based approach (see ARCHITECTURE.md for details)
2. **Update grid layout**: Modify `calculateGridPositions()` for 2x2 or larger grids
3. **Handle multiple remote participants**: Change `getRemoteFaceData()` to return array/map

**Note**: The component rendering logic is already designed to handle multiple participants, so the main work would be in the networking layer. See ARCHITECTURE.md for detailed discussion of networking options.

### Code Quality Recommendations

**Current strengths:**
- Component-based architecture
- Centralized configuration
- Consistent function signatures
- Good debug modes

**Potential improvements:**
- Extract duplicated eye rendering logic into `drawSingleEye()` helper
- Move magic numbers (debug circle sizes, text sizes) to CONFIG
- Add helper function: `getFaceCenter(face)` for consistency across components
- Add defensive checks for `face.keypoints.length` before accessing indices

## Browser Compatibility

Requires a modern browser with:
- WebGL support
- Webcam access (getUserMedia API)
- JavaScript ES6+ enabled

Tested on: Chrome, Firefox, Edge

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [p5.js](https://p5js.org/)
- ML powered by [ml5.js](https://ml5js.org/)
- Face detection using [MediaPipe](https://mediapipe.dev/)
