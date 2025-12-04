# Face Tracking Character Chatting App

A real-time face tracking application built with p5.js and ml5.js that creates cartoon-style facial features tracking your real face movements.

## Features

- **Exaggerated Eyes**: Large cartoon eyes that blink, track pupil movement, and rotate with face tilt
  - Pupils stay clipped within eye boundaries during blinking
  - Side-by-side positioning with no gaps or overlap
  - Vertical offset customization
- **Animated Lips**: Dynamic mouth rendering that changes shape when you talk
  - Smile curve when mouth is closed
  - Oval shape when mouth is open
  - Position exaggeration based on eye scale
- **Expressive Eyebrows**: Smooth eyebrow curves that follow facial movements
  - Scale proportionally with eye size changes
  - Configurable vertical positioning
- **Distance Scaling**: All features scale based on distance from camera
  - Configurable min/max scale limits per component
  - Eyes, lips, and eyebrows respond independently
- **Face Rotation**: Components rotate naturally when you tilt your head
- **Debug Modes**: Multiple visualization options for development

## Technologies Used

- **p5.js**: Creative coding library for canvas rendering
- **ml5.js**: Machine learning library for face mesh detection
- **MediaPipe Face Mesh**: Underlying ML model for 468+ facial landmark detection

## Setup

1. Clone this repository:
```bash
git clone https://github.com/EllieMinhyeonNa/face-tracking-character-chatting-app.git
cd face-tracking-character-chatting-app
```

2. Open `index.html` in a modern web browser

3. Allow camera permissions when prompted

## File Structure

```
├── index.html              # Main HTML with library imports
├── config.js               # Configuration for all visual parameters
├── sketch.js               # Main orchestration and face tracking
├── components/
│   ├── eyes.js            # Eye rendering with rotation and blinking
│   ├── lips.js            # Mouth/lip animation
│   └── eyebrows.js        # Eyebrow tracking
└── CLAUDE.md              # This documentation
```

## Architecture

The application follows a component-based architecture with centralized configuration:

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  Loads: p5.js → ml5.js → config.js → components → sketch│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      config.js                          │
│  • Eyes: exaggeration, scaling, positioning             │
│  • Lips: stroke weight, colors, thresholds              │
│  • Eyebrows: styling, debug settings                    │
│  • Canvas: background color, video toggle               │
│  • Debug: keypoints, indices visibility                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      sketch.js                          │
│  Main Loop:                                             │
│  1. Capture video frame                                 │
│  2. ml5.faceMesh detects face → gotFaces()              │
│  3. Calculate distanceScale from face width             │
│  4. Calculate eyeScale (clamped distanceScale)          │
│  5. Render: eyes → lips → eyebrows                      │
│  6. Handle keyboard input (H, I, K, D, V)               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────┬──────────────────┬───────────────────┐
│  eyes.js         │  lips.js         │  eyebrows.js      │
│ ────────────     │ ────────────     │ ────────────      │
│ • Rotation calc  │ • Open/closed    │ • Top/bottom rows │
│ • Side-by-side   │ • Smile curve    │ • Center curve    │
│ • Blinking       │ • Oval shape     │ • Eye scaling     │
│ • Pupil clipping │ • Exaggeration   │ • Debug points    │
└──────────────────┴──────────────────┴───────────────────┘
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
- Calculates distance-based scaling: `faceWidth / baseFaceWidth`
- Calculates eye scale: `constrain(distanceScale, eyes.minScale, eyes.maxScale)`
- Renders components in order (keypoints → eyes → lips → eyebrows)
- Provides keyboard shortcuts and debug visualization
- Helper functions: `calculateDistanceScale()`, `drawFaceKeypoints()`

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
- Defines top/bottom eyebrow keypoint rows
- Draws curve through centerline
- Optional debug point visualization

## Keyboard Controls

- **`H`**: Toggle face mesh keypoints (green dots) visibility
- **`I`**: Toggle keypoint index numbers on/off
- **`K`**: Toggle face mesh keypoints (green dots) - same as H
- **`D`**: Toggle eyebrow debug points (red circles) on/off
- **`V`**: Toggle between video feed and solid background color

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
