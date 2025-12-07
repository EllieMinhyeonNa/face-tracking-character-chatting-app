// Keypoint Constants - MediaPipe Face Mesh landmark indices
// This file centralizes all facial landmark indices for better code readability

const KEYPOINTS = {
  // === FACE STRUCTURE ===
  NOSE_BRIDGE: 6,
  NOSE_TIP: 1,
  LEFT_FACE_EDGE: 234,
  RIGHT_FACE_EDGE: 454,

  // === EYES ===
  // Left eye
  LEFT_PUPIL: 468,
  LEFT_EYE_LEFT_CORNER: 33,
  LEFT_EYE_RIGHT_CORNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,

  // Right eye
  RIGHT_PUPIL: 473,
  RIGHT_EYE_LEFT_CORNER: 362,
  RIGHT_EYE_RIGHT_CORNER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,

  // === EYEBROWS ===
  // Left eyebrow - top row (outer to inner)
  EYEBROW_LEFT_TOP_ROW: [70, 63, 105, 66, 107],
  // Left eyebrow - bottom row (outer to inner)
  EYEBROW_LEFT_BOTTOM_ROW: [46, 53, 52, 65, 55],

  // Right eyebrow - top row (inner to outer)
  EYEBROW_RIGHT_TOP_ROW: [300, 293, 334, 296, 336],
  // Right eyebrow - bottom row (inner to outer)
  EYEBROW_RIGHT_BOTTOM_ROW: [276, 283, 282, 295, 285],

  // === LIPS ===
  // Outer lip points
  LIP_LEFT_CORNER: 61,
  LIP_RIGHT_CORNER: 291,
  LIP_TOP_CENTER: 13,
  LIP_BOTTOM_CENTER: 14,

  // Upper lip outer contour (left to right)
  LIP_UPPER_OUTER: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  // Lower lip outer contour (left to right)
  LIP_LOWER_OUTER: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],

  // Upper lip inner contour (left to right)
  LIP_UPPER_INNER: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  // Lower lip inner contour (left to right)
  LIP_LOWER_INNER: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
};
