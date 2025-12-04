// Configuration file - central place for all visual parameters

const CONFIG = {
  // Eye settings
  eyes: {
    exaggerationFactor: 1.5,  // How much bigger than real eyes
    aspectRatio: 1.2,          // Height to width ratio when fully open
    pupilSizeRatio: 0.2,       // Pupil size relative to eye height
  },

  // Lip settings
  lips: {
    strokeWeight: 7,           // Base stroke thickness
    openThreshold: 0.05,       // Threshold for mouth open/closed
    color: [255, 0, 0],        // Red color
  },

  // Eyebrow settings
  eyebrows: {
    strokeWeight: 7,           // Base stroke thickness
    color: [0, 0, 0],          // Black color
    showDebugPoints: false,    // Toggle red debug circles
  },

  // Distance scale settings
  distance: {
    baseFaceWidth: 150,        // Reference face width for normal distance
  },

  // Debug settings
  debug: {
    showKeypoints: true,       // Show green face mesh points
    showIndices: false,        // Show keypoint index numbers
  }
};
