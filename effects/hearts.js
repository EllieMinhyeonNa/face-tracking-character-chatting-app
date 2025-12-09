// Hearts effect - floating hearts when smiling
// Example of how easy it is to add a new effect!

// === EFFECT REGISTRATION ===
// Detector function for smile
function detectSmile(expressionData) {
  const SMILE_THRESHOLD = 0.3; // 30% smile curve
  return expressionData.mouthCurveAmount >= SMILE_THRESHOLD;
}

// Renderer function for hearts
function drawHearts(intensity, centerX, centerY, canvas) {
  // Simple hearts for now - just draw some red circles that float up
  canvas.push();
  canvas.fill(255, 100, 150, 200); // Pink
  canvas.noStroke();

  // Draw 3 hearts floating at different heights
  let time = millis() / 1000; // Time in seconds
  for (let i = 0; i < 3; i++) {
    let offsetX = sin(time + i) * 30;
    let offsetY = -50 - (time % 2) * 100 + i * 40;
    canvas.circle(centerX + offsetX, centerY + offsetY, 20);
  }

  canvas.pop();
}

// Register this effect with the manager
if (typeof effectManager !== 'undefined') {
  effectManager.registerEffect(
    'smile',              // Effect name
    detectSmile,          // Detector function
    drawHearts,           // Renderer function
    {
      minDuration: 300,   // Wait 300ms to confirm smile
      priority: 1         // Render after speedlines (priority 0)
    }
  );
}
