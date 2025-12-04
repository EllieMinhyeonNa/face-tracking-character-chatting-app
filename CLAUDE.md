# Face Tracking Character Chatting App

A real-time face tracking application built with p5.js and ml5.js that detects facial landmarks and tracks eye movements using machine learning.

## Features

- Real-time face mesh detection with 468+ facial keypoints
- Pupil tracking and visualization
- Eye position detection with highlighted circles
- Webcam integration for live video processing

## Technologies Used

- **p5.js**: Creative coding library for canvas rendering
- **ml5.js**: Machine learning library for face mesh detection
- **MediaPipe Face Mesh**: Underlying ML model for facial landmark detection

## Setup

1. Clone this repository:
```bash
git clone https://github.com/EllieMinhyeonNa/face-tracking-character-chatting-app.git
cd face-tracking-character-chatting-app
```

2. Open `index.html` in a modern web browser

3. Allow camera permissions when prompted

## How It Works

The application uses ml5.js's faceMesh model to detect and track facial features in real-time:

- **Green dots**: 468 facial keypoints mapping the entire face structure
- **Cyan circles**: Highlighted areas around left and right pupils
- **Pink dots**: Precise pupil center points (keypoints 468 and 473)

## File Structure

```
├── index.html          # Main HTML file with p5.js and ml5.js setup
├── sketch.js           # p5.js sketch with face tracking logic
└── CLAUDE.md           # Project documentation
```

## Code Overview

The main functionality is implemented in `sketch.js`:

- `preload()`: Initializes the faceMesh model
- `setup()`: Creates canvas and starts webcam capture
- `draw()`: Renders video feed and facial landmarks
- `gotFaces()`: Callback function that receives face detection results

## Browser Compatibility

Requires a modern browser with:
- WebGL support
- Webcam access (getUserMedia API)
- JavaScript enabled

Tested on: Chrome, Firefox, Edge

## Future Enhancements

- Character animation based on facial expressions
- Chat interface integration
- Expression recognition
- Multiple face tracking

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [p5.js](https://p5js.org/)
- ML powered by [ml5.js](https://ml5js.org/)
- Face detection using [MediaPipe](https://mediapipe.dev/)
