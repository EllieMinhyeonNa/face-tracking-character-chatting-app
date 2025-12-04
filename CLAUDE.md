# Face Tracking Character Chatting App

A real-time face tracking application built with p5.js and ml5.js that creates cartoon-style facial features tracking your real face movements.

## Features

- **Exaggerated Eyes**: Large cartoon eyes that blink, track pupil movement, and rotate with face tilt
- **Animated Lips**: Dynamic mouth rendering that changes shape when you talk
- **Expressive Eyebrows**: Smooth eyebrow curves that follow facial movements
- **Distance Scaling**: All features scale based on distance from camera
- **Face Rotation**: Components rotate naturally when you tilt your head

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

### config.js
Central configuration file containing all adjustable parameters:
- Eye exaggeration factors, aspect ratios, pupil sizes
- Lip stroke weights, colors, open/closed thresholds
- Eyebrow styles and debug settings
- Distance scaling parameters

### sketch.js
Main orchestrator that:
- Sets up webcam and face mesh detection
- Calculates distance-based scaling
- Renders all components in proper order
- Provides debug visualization toggles

### Components
Each component (eyes, lips, eyebrows) is self-contained:
- Receives `face` data and `distanceScale` parameter
- Handles its own rendering logic
- Uses centralized CONFIG for styling

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

- **`i`**: Toggle keypoint index numbers on/off
- **`k`**: Toggle face mesh keypoints (green dots) on/off
- **`d`**: Toggle eyebrow debug points (red circles) on/off

## Configuration

Edit `config.js` to customize visual appearance:

```javascript
CONFIG.eyes.exaggerationFactor = 1.5;  // Eye size multiplier
CONFIG.eyes.pupilSizeRatio = 0.2;      // Pupil size
CONFIG.lips.strokeWeight = 7;          // Lip line thickness
CONFIG.eyebrows.strokeWeight = 7;      // Eyebrow line thickness
```

## Extending the Application

The codebase is designed for easy extension:

1. **Add new face components**: Create a new file in `components/`
   - Follow the pattern: `function drawComponentName(face, distanceScale)`
   - Add configuration to `config.js`
   - Import in `index.html` and call in `sketch.js`

2. **Modify existing components**: All magic numbers are in `config.js`
   - Change colors, sizes, thresholds without touching component code
   - Toggle debug features via keyboard or CONFIG

3. **Add facial expressions**: Components already receive full face data
   - Access all 468 keypoints via `face.keypoints[index]`
   - Calculate custom ratios (smile, surprise, etc.)
   - Implement state-based rendering

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
