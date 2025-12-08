// Configuration file - central place for all visual parameters

const CONFIG = {
  // Eye settings
  eyes: {
    exaggerationFactor: 1.7,  // How much bigger than real eyes
    aspectRatio: 1.2,          // Height to width ratio when fully open
    pupilSizeRatio: 0.2,       // Pupil size relative to eye height
    minScale: 1.0,             // Minimum scale when far from camera (0.5 = 50% of normal)
    maxScale: 1.6,             // Maximum scale when close to camera (2.0 = 200% of normal)
    verticalOffset: 30,         // Vertical position adjustment in pixels (positive = down, negative = up)
  },

  // Lip settings
  lips: {
    exaggerationFactor: 1.0,
    minScale: 0.5,
    maxScale: 1.5,
    strokeWeight: 8,           // Base stroke thickness
    openThreshold: 0.05,       // Threshold for mouth open/closed
    color: [210, 45, 45],        // Red color
    verticalOffset: -10,
  },

  // Eyebrow settings
  eyebrows: {
    strokeWeight: 8,           // Base stroke thickness
    exaggerationFactor: 1.0,   // How much to exaggerate eyebrow movements/size
    color: [0, 0, 0],          // Black color
    showDebugPoints: false,    // Toggle red debug circles
    minScale: 0.5,             // Minimum scale when far from camera
    maxScale: 1.5,             // Maximum scale when close to camera
    verticalOffset: 25,
    showDynamicsDebug: true,   // Show on-screen debug info for eyebrow dynamics
    raiseHeightMultiplier: 1, // How much to raise eyebrows when raised
    raiseArchMultiplier: 1.0,  // How much to arch eyebrows when raised
  },

  // Distance scale settings
  distance: {
    baseFaceWidth: 150,        // Reference face width for normal distance
  },

  // Debug settings
  debug: {
    showKeypoints: true,       // Show green face mesh points
    showIndices: false,        // Show keypoint index numbers
    showParticipantIds: false, // Show participant IDs for multi-user
  },

  // Canvas settings
  canvas: {
    backgroundColor: [255, 74, 74],  // Background color (RGB)
    showVideo: true,                 // Show webcam video feed
  }
};
