// Laugh effect - triggers on smile with squinty eyes

// Cache Haha positions per canvas; regenerate periodically
let laughTextPositions = new Map();
let laughTextTimestamps = new Map();

function detectLaugh(expressionData) {
  const EYE_SQUINT_MAX = 0.60;   // eyes fairly closed
  const SMILE_CURVE_MIN = 0.35;  // corners up
  const MOUTH_OPEN_MIN = 0.10;   // slightly open

  const eyeL = expressionData.leftEyeOpenRatio ?? 1;
  const eyeR = expressionData.rightEyeOpenRatio ?? 1;
  const curve = expressionData.mouthCurveAmount ?? 0;
  const mouth = expressionData.mouthOpenRatio ?? 0;

  const squinty = eyeL < EYE_SQUINT_MAX && eyeR < EYE_SQUINT_MAX;
  const smiley = curve >= SMILE_CURVE_MIN;
  const mouthOpen = mouth >= MOUTH_OPEN_MIN;

  return squinty && smiley && mouthOpen;
}

function drawLaughBurst(intensity, centerX, centerY, canvas) {
  drawHahaTexts(intensity, centerX, centerY, canvas);
}

// Softly scattered "Haha" texts around the face with margins
function drawHahaTexts(intensity, centerX, centerY, canvas) {
  const margin = canvas.width * 0.06;
  const faceRadius = canvas.width * 0.18;
  const count = 8;
  const minSpacing = canvas.width * 0.08;

  canvas.push();
  canvas.textAlign(CENTER, CENTER);
  canvas.textSize(canvas.width * 0.04);
  canvas.fill(255, 240, 230, 180 * intensity);
  canvas.noStroke();

  // Move to center; if local canvas is mirrored, flip text back
  canvas.translate(centerX, centerY);
  const isMirrored = (typeof effectsCanvas1 !== 'undefined') && canvas === effectsCanvas1;
  if (isMirrored) {
    canvas.scale(-1, 1);
  }

  const REGEN_MS = 1500; // regenerate positions every 2 seconds

  // Generate positions with periodic refresh
  let positions = laughTextPositions.get(canvas);
  let lastGen = laughTextTimestamps.get(canvas) || 0;
  const shouldRegen = !positions || positions.length !== count || millis() - lastGen > REGEN_MS;

  if (shouldRegen) {
    const minRadius = faceRadius + canvas.width * 0.12;
    const maxRadius = faceRadius + canvas.width * 0.38;

    positions = [];
    const baseAngles = Array.from({ length: count }, (_, i) => (TWO_PI * i) / count);

    for (let i = 0; i < baseAngles.length; i++) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 40) {
        attempts++;
        const angle = baseAngles[i] + random(-0.5, 0.5); // jitter for randomness
        const radius = random(minRadius, maxRadius);
        let x = cos(angle) * radius;
        let y = sin(angle) * radius;

        x = constrain(x, -canvas.width / 2 + margin, canvas.width / 2 - margin);
        y = constrain(y, -canvas.height / 2 + margin, canvas.height / 2 - margin);

        let tooClose = false;
        for (const p of positions) {
          if (dist(p.x, p.y, x, y) < minSpacing) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        positions.push({ x, y, angle });
        placed = true;
      }
    }

    laughTextPositions.set(canvas, positions.slice(0, count));
    laughTextTimestamps.set(canvas, millis());
  }

  positions.forEach(({ x, y, angle }) => {
    canvas.push();
    canvas.translate(x, y - canvas.height * 0.05);
    // Flip vertically so text reads upright even in mirrored canvas
    canvas.scale(1, -1);
    // Slight random rotation
    canvas.rotate(angle + random(-0.2, 0.2));
    canvas.text('Haha', 0, 0);
    canvas.pop();
  });

  canvas.pop();
}

if (typeof effectManager !== 'undefined') {
  effectManager.registerEffect('laugh', detectLaugh, drawLaughBurst, {
    minDuration: 180,
    priority: 1
  });
}
