// Speed lines effect - radiating lines that fade near center
// Triggered by "surprised" expression

// --- Configuration ---
let numStars = 100; // Low density
let baseSpeed = 70; // How fast they move normally
let currentSpeed = baseSpeed;

// Array to hold the star objects
let stars = [];

// Effect state
let speedLinesState = {
  active: false,
  initialized: false
};

/**
 * Initialize the speed lines effect
 * Creates the star objects
 */
function initSpeedLines() {
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }
  speedLinesState.initialized = true;
  console.log('✨ Speed lines initialized!');
}

/**
 * Activates speed lines effect (for "surprised" expression)
 */
function activateSpeedLines() {
  if (!speedLinesState.initialized) {
    initSpeedLines();
  }
  if (!speedLinesState.active) {
    console.log('🌟 SPEED LINES ACTIVATED!');
  }
  speedLinesState.active = true;
}

/**
 * Deactivates speed lines effect
 */
function deactivateSpeedLines() {
  speedLinesState.active = false;
}

/**
 * Draws the speed lines effect
 * Call this in draw() loop BEFORE drawing the character
 * @param {number} surpriseAmount - 0 to 1, how surprised (affects speed)
 * @param {number} faceCenterX - X position of face center
 * @param {number} faceCenterY - Y position of face center
 */
function drawSpeedLines(surpriseAmount = 0, faceCenterX = width / 2, faceCenterY = height / 2) {
  if (!speedLinesState.active) {
    return; // Not active, do nothing
  }

  // Map surprise amount to speed (more surprised = faster lines)
  currentSpeed = map(surpriseAmount, 0, 1, baseSpeed, 80);

  // Save current transformation state
  push();

  // Move origin to face center for radial effect that follows the face
  translate(faceCenterX, faceCenterY);

  // Update and draw each star
  for (let i = 0; i < stars.length; i++) {
    stars[i].update();
    stars[i].show();
  }

  // Restore transformation state
  pop();
}

/**
 * Get current speed lines state for debugging
 * @returns {object} Current state
 */
function getSpeedLinesState() {
  return speedLinesState;
}

// --- The Star Class ---
class Star {
  constructor() {
    // x and y represent position across the screen
    // We spread them wide so they enter from outside the frame
    this.x = random(-width, width);
    this.y = random(-height, height);

    // z represents depth (how far away it is).
    // Starts random distance away.
    this.z = random(width);

    // pz stores the 'previous z' position held last frame
    // This is crucial for drawing the tail of the streak.
    this.pz = this.z;
  }

  update() {
    // Move the star closer to the screen by decreasing Z depth
    this.z = this.z - currentSpeed;

    // If the star passes the screen (z goes below 1), reset it to the back
    if (this.z < 1) {
      this.z = width;
      this.x = random(-width, width);
      this.y = random(-height, height);
      // Reset previous z so we don't draw a giant streak across the screen on reset
      this.pz = this.z;
    }
  }

  show() {
    // --- Perspective Math ---
    // Map 3D coordinates to 2D screen space.
    // Dividing by 'z' creates perspective: things get bigger as z gets smaller.

    // 1. Calculate current 2D position (sx, sy)
    let sx = map(this.x / this.z, 0, 1, 0, width);
    let sy = map(this.y / this.z, 0, 1, 0, height);

    // 2. Calculate previous 2D position (px, py) using previous Z (pz)
    // Make lines longer by going further back in the previous position
    let lineLengthMultiplier = 3.0; // Make lines 2.5x longer
    let extendedPZ = this.pz + (this.pz - this.z) * lineLengthMultiplier;
    let px = map(this.x / extendedPZ, 0, 1, 0, width);
    let py = map(this.y / extendedPZ, 0, 1, 0, height);

    // --- FADE OUT NEAR FACE ---
    // Calculate distances from face center (0, 0) - remember we translated to face center
    let distFromFace_start = dist(0, 0, px, py); // Distance at line start (further away)
    let distFromFace_end = dist(0, 0, sx, sy);   // Distance at line end (closer)

    // Lines are completely transparent within 150px of face, then fade in
    let innerFadeRadius = 120;  // Completely transparent zone
    let outerFadeRadius = 200; // Fully visible beyond this distance

    // Calculate alpha for both ends of the line
    // Map: 0-30px = 0 alpha (transparent), 30-150px = 0-255 alpha (fade in), 150px+ = 255 alpha (opaque)
    let alphaStart = map(distFromFace_start, innerFadeRadius, outerFadeRadius, 0, 255);
    let alphaEnd = map(distFromFace_end, innerFadeRadius, outerFadeRadius, 0, 255);
    alphaStart = constrain(alphaStart, 0, 255);
    alphaEnd = constrain(alphaEnd, 0, 255);

    // Use the minimum alpha (fade out more aggressively near face)
    let alpha = min(alphaStart, alphaEnd);

    // 3. Draw tapered line (thick in middle, pointed at ends) - only if on screen
    if (sx < width && sx > -width && sy < height && sy > -height) {
      // Draw as a filled shape with tapered ends
      fill(255, 255, 255, alpha);
      noStroke();

      // Calculate angle and perpendicular offset for width
      let angle = atan2(sy - py, sx - px);
      let perpAngle = angle + HALF_PI;

      // Max width in the middle
      let maxWidth = 3;

      // Create 4 points for a tapered quad (diamond/spindle shape)
      // Start point (tapered to point)
      let p1x = px;
      let p1y = py;

      // Middle-start (full width)
      let m1x = lerp(px, sx, 0.3) + cos(perpAngle) * maxWidth / 2;
      let m1y = lerp(py, sy, 0.3) + sin(perpAngle) * maxWidth / 2;

      // Middle-end (full width, other side)
      let m2x = lerp(px, sx, 0.7) + cos(perpAngle) * maxWidth / 2;
      let m2y = lerp(py, sy, 0.7) + sin(perpAngle) * maxWidth / 2;

      // End point (tapered to point)
      let p2x = sx;
      let p2y = sy;

      // Other side of the line
      let m3x = lerp(px, sx, 0.7) - cos(perpAngle) * maxWidth / 2;
      let m3y = lerp(py, sy, 0.7) - sin(perpAngle) * maxWidth / 2;

      let m4x = lerp(px, sx, 0.3) - cos(perpAngle) * maxWidth / 2;
      let m4y = lerp(py, sy, 0.3) - sin(perpAngle) * maxWidth / 2;

      // Draw the tapered shape
      beginShape();
      vertex(p1x, p1y);     // Start point
      vertex(m1x, m1y);     // Widen
      vertex(m2x, m2y);     // Stay wide
      vertex(p2x, p2y);     // Taper to end
      vertex(m3x, m3y);     // Other side wide
      vertex(m4x, m4y);     // Other side widen
      endShape(CLOSE);
    }

    // Update previous z for the next frame's calculation
    this.pz = this.z;
  }
}
