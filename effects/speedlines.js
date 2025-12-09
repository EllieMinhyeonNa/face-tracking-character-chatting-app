// Speed lines effect - radiating lines that fade near center
// Triggered by "surprised" expression
// NOW SUPPORTS MULTI-CANVAS! Each canvas has its own speed lines.

// === EFFECT REGISTRATION ===
// Detector function for surprise
function detectSurprise(expressionData) {
  const BROW_THRESHOLD = 0.15;   // 15% eyebrow raise
  const MOUTH_THRESHOLD = 0.15;  // 15% mouth opening

  return expressionData.browRaiseAmount >= BROW_THRESHOLD &&
         expressionData.mouthOpenRatio >= MOUTH_THRESHOLD;
}

// Register this effect with the manager (called after page loads)
if (typeof effectManager !== 'undefined') {
  effectManager.registerEffect(
    'surprised',           // Effect name
    detectSurprise,        // Detector function
    drawSpeedLines,        // Renderer function
    { minDuration: 200 }   // Options
  );
}

// --- Configuration ---
let numStars = 100; // Low density
let baseSpeed = 70; // How fast they move normally

// Store stars per canvas (keyed by canvas object)
let canvasStars = new Map();

/**
 * Initialize speed lines for a specific canvas
 * @param {object} g - Graphics context
 */
function initSpeedLinesForCanvas(g) {
  if (!g) return;

  let stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star(g.width, g.height));
  }
  canvasStars.set(g, stars);
  console.log('✨ Speed lines initialized for canvas!');
}

/**
 * Draws the speed lines effect on a specific canvas
 * @param {number} surpriseAmount - 0 to 1, how surprised (affects speed)
 * @param {number} faceCenterX - X position of face center (in face coordinates)
 * @param {number} faceCenterY - Y position of face center (in face coordinates)
 * @param {object} g - Graphics context to draw on
 */
function drawSpeedLines(surpriseAmount = 0, faceCenterX = 0, faceCenterY = 0, g = null) {
  // Use global context if none provided (backward compatibility)
  let ctx = g || window;

  // Get canvas dimensions
  let canvasWidth = g ? g.width : width;
  let canvasHeight = g ? g.height : height;

  // Initialize stars for this canvas if not done yet
  if (g && !canvasStars.has(g)) {
    initSpeedLinesForCanvas(g);
  }

  // Get stars for this canvas (or use global for backward compat)
  let stars = g ? canvasStars.get(g) : [];
  if (!stars || stars.length === 0) return;

  // Map surprise amount to speed (more surprised = faster lines)
  let currentSpeed = map(surpriseAmount, 0, 1, baseSpeed, 80);

  // Scale speed relative to canvas width for consistent animation
  let scaledSpeed = currentSpeed * (canvasWidth / 640);

  // Save current transformation state
  ctx.push();

  // Move origin to face center for radial effect that follows the face
  ctx.translate(faceCenterX, faceCenterY);

  // Update and draw each star
  for (let i = 0; i < stars.length; i++) {
    stars[i].update(scaledSpeed, canvasWidth, canvasHeight);
    stars[i].show(ctx, canvasWidth, canvasHeight);
  }

  // Restore transformation state
  ctx.pop();
}

// --- The Star Class ---
class Star {
  constructor(canvasWidth, canvasHeight) {
    // x and y represent position across the screen
    // We spread them wide so they enter from outside the frame
    this.x = random(-canvasWidth, canvasWidth);
    this.y = random(-canvasHeight, canvasHeight);

    // z represents depth (how far away it is).
    // Starts random distance away.
    this.z = random(canvasWidth);

    // pz stores the 'previous z' position held last frame
    // This is crucial for drawing the tail of the streak.
    this.pz = this.z;
  }

  update(scaledSpeed, canvasWidth, canvasHeight) {
    // Move the star closer to the screen by decreasing Z depth
    this.z = this.z - scaledSpeed;

    // If the star passes the screen (z goes below 1), reset it to the back
    if (this.z < 1) {
      this.z = canvasWidth;
      this.x = random(-canvasWidth, canvasWidth);
      this.y = random(-canvasHeight, canvasHeight);
      // Reset previous z so we don't draw a giant streak across the screen on reset
      this.pz = this.z;
    }
  }

  show(ctx, canvasWidth, canvasHeight) {
    // --- Perspective Math ---
    // Map 3D coordinates to 2D screen space.
    // Dividing by 'z' creates perspective: things get bigger as z gets smaller.

    // 1. Calculate current 2D position (sx, sy)
    let sx = map(this.x / this.z, 0, 1, 0, canvasWidth);
    let sy = map(this.y / this.z, 0, 1, 0, canvasHeight);

    // 2. Calculate previous 2D position (px, py) using previous Z (pz)
    // Make lines longer by going further back in the previous position
    let lineLengthMultiplier = 3.0;
    let extendedPZ = this.pz + (this.pz - this.z) * lineLengthMultiplier;
    let px = map(this.x / extendedPZ, 0, 1, 0, canvasWidth);
    let py = map(this.y / extendedPZ, 0, 1, 0, canvasHeight);

    // --- FADE OUT NEAR FACE ---
    // Calculate distances from face center (0, 0) - remember we translated to face center
    let distFromFace_start = dist(0, 0, px, py);
    let distFromFace_end = dist(0, 0, sx, sy);

    // Lines are completely transparent within 120px of face, then fade in
    let innerFadeRadius = 120;
    let outerFadeRadius = 200;

    // Calculate alpha for both ends of the line
    let alphaStart = map(distFromFace_start, innerFadeRadius, outerFadeRadius, 0, 255);
    let alphaEnd = map(distFromFace_end, innerFadeRadius, outerFadeRadius, 0, 255);
    alphaStart = constrain(alphaStart, 0, 255);
    alphaEnd = constrain(alphaEnd, 0, 255);

    // Use the minimum alpha (fade out more aggressively near face)
    let alpha = min(alphaStart, alphaEnd);

    // 3. Draw tapered line (thick in middle, pointed at ends) - only if on screen
    if (sx < canvasWidth && sx > -canvasWidth && sy < canvasHeight && sy > -canvasHeight) {
      // Draw as a filled shape with tapered ends
      ctx.fill(255, 255, 255, alpha);
      ctx.noStroke();

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
      ctx.beginShape();
      ctx.vertex(p1x, p1y);     // Start point
      ctx.vertex(m1x, m1y);     // Widen
      ctx.vertex(m2x, m2y);     // Stay wide
      ctx.vertex(p2x, p2y);     // Taper to end
      ctx.vertex(m3x, m3y);     // Other side wide
      ctx.vertex(m4x, m4y);     // Other side widen
      ctx.endShape(CLOSE);
    }

    // Update previous z for the next frame's calculation
    this.pz = this.z;
  }
}
