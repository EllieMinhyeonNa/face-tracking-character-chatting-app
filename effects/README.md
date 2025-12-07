# Effects System

Event-based visual effects triggered by facial expressions.

## Architecture

```
┌─────────────────────────────────────────────┐
│              sketch.js (main loop)          │
│                                             │
│  1. Get measurements from components        │
│     - browRaiseAmount (from eyebrows.js)    │
│     - mouthOpenRatio (from lips.js)         │
│                                             │
│  2. Detect events (events.js)               │
│     - detectSurprised()                     │
│                                             │
│  3. Activate effects (speedlines.js)        │
│     - activateSpeedLines()                  │
│                                             │
│  4. Apply effects during rendering          │
│     - drawSpeedLines()                      │
│     - [draw components]                     │
└─────────────────────────────────────────────┘
```

## Files

### `events.js`
Detects facial expression events based on component measurements.

**Functions:**
- `detectSurprised(browRaiseAmount, mouthOpenRatio)` - Returns true if surprised expression detected
- `getEventStates()` - Returns current event states for debugging

**Surprised Detection:**
- Eyebrows raised: ≥ 20% (0.2)
- Mouth open ratio: ≥ 15% (0.15)
- Minimum duration: 200ms (prevents false triggers)

### `speedlines.js`
Handles speed lines effect radiating from face center.

**Functions:**
- `activateSpeedLines()` - Starts speed lines effect
- `deactivateSpeedLines()` - Stops speed lines effect
- `drawSpeedLines(surpriseAmount, faceCenterX, faceCenterY)` - Draws the effect
- `getSpeedLinesState()` - Returns current effect state for debugging

**Speed Lines Effect:**
- 100 stars creating 3D perspective speed lines
- Lines radiate from face center (follows face movement)
- Tapered/spindle shape (pointed ends, thick middle)
- Speed: 70 base, up to 80 when fully surprised
- Fade radius: 120px inner (transparent), 200px outer (fully visible)
- Line length multiplier: 3.0x

## Usage in sketch.js

```javascript
function draw() {
  // 1. Get measurements
  let browRaiseAmount = window.browRaiseAmount || 0;
  let mouthOpenRatio = window.mouthOpenRatio || 0;

  // 2. Detect event
  let isSurprised = detectSurprised(browRaiseAmount, mouthOpenRatio);

  // 3. Activate/deactivate effects
  if (isSurprised) {
    activateSpeedLines();
  } else {
    deactivateSpeedLines();
  }

  // 4. Calculate face center
  let noseBridge = face.keypoints[KEYPOINTS.NOSE_BRIDGE];
  let faceCenterX = noseBridge.x;
  let faceCenterY = noseBridge.y;

  // 5. Draw speed lines (before components)
  drawSpeedLines(browRaiseAmount, faceCenterX, faceCenterY);

  // 6. Draw components
  drawEyes(face, distanceScale);
  drawLips(face, distanceScale, eyeScale);
  drawEyebrows(face, distanceScale, eyeScale);
}
```

## Component Integration

Components expose their measurements to `window` scope:

**eyebrows.js:**
```javascript
window.browRaiseAmount = browRaiseAmount; // 0 to 1
```

**lips.js:**
```javascript
window.mouthOpenRatio = openRatio; // mouth height / width
```

## Adding New Events

1. **Add detection function in `events.js`:**
```javascript
function detectHappy(mouthCurveAmount) {
  const SMILE_THRESHOLD = 0.5;
  return mouthCurveAmount >= SMILE_THRESHOLD;
}
```

2. **Create new effect file (e.g., `effects/sparkles.js`):**
```javascript
function activateSparkles() {
  // Initialize sparkles
}

function deactivateSparkles() {
  // Stop sparkles
}

function drawSparkles(faceCenterX, faceCenterY) {
  // Draw sparkles around face
}
```

3. **Integrate in `sketch.js`:**
```javascript
let isHappy = detectHappy(window.mouthCurveAmount);
if (isHappy) {
  activateSparkles();
} else {
  deactivateSparkles();
}
drawSparkles(faceCenterX, faceCenterY);
```

## Testing

**To test "surprised" effect:**
1. Open the application
2. Raise your eyebrows (≥ 20%)
3. Open your mouth in "O" shape (≥ 15% width)
4. Hold for 0.2 seconds
5. You should see speed lines radiating from your face!

## Debug

Check console for event states:
```javascript
console.log(getEventStates());
console.log(getSpeedLinesState());
```

## Future Enhancements

Ideas for additional events/effects:
- **Happy** (smile) → Color shift, sparkles, confetti
- **Sad** (frown + lowered brows) → Desaturation, rain drops
- **Angry** (furrowed brows) → Red tint, screen shake, heat waves
- **Wink** → Camera flash effect, star twinkle
- **Mouth wide open** → Sound wave ripples
