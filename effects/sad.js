// Sad effect - mouth curve below threshold triggers rain background

let sadRaindrops = new Map();

function detectSad(expressionData) {
  const FROWN_THRESHOLD = -0.20; // mouthCurveAmount negative = frown
  const curve = expressionData.mouthCurveAmount ?? 0;
  return curve <= FROWN_THRESHOLD;
}

function initSadDrops(canvas) {
  const drops = [];
  const count = 80;
  for (let i = 0; i < count; i++) {
    drops.push({
      x: random(canvas.width),
      y: random(-canvas.height, canvas.height),
      len: random(canvas.height * 0.03, canvas.height * 0.08),
      speed: random(3, 6) * (canvas.height / 480),
      alpha: random(110, 180)
    });
  }
  sadRaindrops.set(canvas, drops);
  return drops;
}

function drawSadRain(intensity, centerX, centerY, canvas) {
  let drops = sadRaindrops.get(canvas);
  if (!drops) {
    drops = initSadDrops(canvas);
  }

  canvas.push();
  canvas.stroke(255, 255, 255, 140 * intensity);
  canvas.strokeWeight(3.5); // fixed stroke width
  canvas.strokeCap(ROUND);

  for (let d of drops) {
    const fall = d.speed * (0.6 + intensity * 0.6);
    d.y += fall;

    if (d.y - d.len > canvas.height) {
      d.y = random(-canvas.height * 0.5, 0);
      d.x = random(canvas.width);
    }

    canvas.line(d.x, d.y, d.x, d.y - d.len);
  }

  canvas.pop();
}

if (typeof effectManager !== 'undefined') {
  effectManager.registerEffect('sad', detectSad, drawSadRain, {
    minDuration: 150,
    priority: 0
  });
}
