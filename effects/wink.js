// Wink effect - floating hearts when one eye is closed and the other is open

// Store heart particles per canvas
let winkHearts = new Map();

// Detector: trigger when exactly one eye is closed (not a full blink)
function detectWink(expressionData) {
  const CLOSED_THRESHOLD = 0.3;
  const OPEN_THRESHOLD = 0.42;

  const left = expressionData.leftEyeOpenRatio ?? 1;
  const right = expressionData.rightEyeOpenRatio ?? 1;

  const leftClosed = left < CLOSED_THRESHOLD;
  const rightClosed = right < CLOSED_THRESHOLD;

  // Ignore blinks (both closed) and noisy half-open states
  if ((leftClosed && rightClosed) || (!leftClosed && !rightClosed)) return false;

  const leftOpen = left > OPEN_THRESHOLD;
  const rightOpen = right > OPEN_THRESHOLD;

  return (leftClosed && rightOpen) || (rightClosed && leftOpen);
}

function getCanvasHearts(canvas) {
  if (!winkHearts.has(canvas)) {
    winkHearts.set(canvas, []);
  }
  return winkHearts.get(canvas);
}

function spawnHearts(canvas, count, originX, originY, side) {
  const hearts = getCanvasHearts(canvas);

  // Participant-specific palettes (guest = cooler / neutral)
  const isGuestCanvas = (typeof effectsCanvas2 !== 'undefined') && canvas === effectsCanvas2;
  const hostPalette = [ [255, 120, 140], [255, 160, 185], [255, 205, 220], [255, 235, 245] ];
  const guestPalette = [ [245, 245, 255], [225, 230, 250], [210, 220, 245], [255, 255, 255] ];
  const palette = isGuestCanvas ? guestPalette : hostPalette;

  for (let i = 0; i < count; i++) {
    const fanDir = random([-1, 1]) * random(0.3, 1) * (side || 1);
    hearts.push({
      x: originX + random(-200, 110),
      y: originY + random(-80, 10),
      vx: random(-0.35, 0.75) + fanDir * 0.3,
      vy: random(-2.1, -3.0),
      size: random(120, 150),
      life: random(40, 80),
      maxLife: 80,
      tint: random(palette),
      originX,
      originY,
      fanDir
    });
  }
}

function drawHeartShape(canvas, size) {
  const s = size / 2;
  canvas.beginShape();
  canvas.vertex(0, s * 0.6);
  canvas.bezierVertex(-s, -s * 0.4, -s * 0.8, -s * 1.1, 0, -s * 0.2);
  canvas.bezierVertex(s * 0.8, -s * 1.1, s, -s * 0.4, 0, s * 0.6);
  canvas.endShape(CLOSE);
}

// Renderer: emit and animate hearts when a wink is active
function drawWinkHearts(intensity, centerX, centerY, canvas, expressionData = {}) {
  const left = expressionData.leftEyeOpenRatio ?? 1;
  const right = expressionData.rightEyeOpenRatio ?? 1;
  const side = left < right ? -1 : 1; // -1 = left wink, 1 = right wink

  const originX = centerX + side * canvas.width * 0.14;
  const originY = centerY - canvas.height * 0.12; // start above eyebrows

  // Emit lightly (about every 3 frames) to avoid stacking
  if (frameCount % 5 === 0) {
    spawnHearts(canvas, 1, originX, originY, side);
  }

  const hearts = getCanvasHearts(canvas);

  canvas.push();
  canvas.noStroke();

  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.x += h.vx;
    h.y += h.vy;
    // Gradually fan outward as hearts rise
    const age = 1 - h.life / h.maxLife;
    const outwardPush = map(age, 0, 1, 0, 0.22) * h.fanDir;
    h.vx += outwardPush;
    h.vx *= 0.985;
    h.vy -= 0.01; // slight acceleration upward
    h.life -= 1;

    const alpha = map(h.life, 0, h.maxLife, 0, 210);
    if (alpha <= 0) {
      hearts.splice(i, 1);
      continue;
    }

    canvas.push();
    canvas.translate(h.x, h.y);
    canvas.scale(1, 0.95); // squish slightly for charm
    canvas.fill(h.tint[0], h.tint[1], h.tint[2], alpha);
    drawHeartShape(canvas, h.size * intensity);
    canvas.pop();
  }

  canvas.pop();
}

// Register the wink effect
if (typeof effectManager !== 'undefined') {
  effectManager.registerEffect(
    'wink',
    detectWink,
    drawWinkHearts,
    {
      minDuration: 120, // small debounce so quick winks still register
      priority: 2       // render above other effects
    }
  );
}
