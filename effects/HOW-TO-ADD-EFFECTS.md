# How to Add New Effects

The Effect Manager system makes it super easy to add new visual effects triggered by facial expressions!

## Quick Start (3 Steps)

### 1. Create Your Effect File

Create a new file in `effects/` folder (e.g., `effects/hearts.js`):

```javascript
// Detector function - returns true when effect should trigger
function detectSmile(expressionData) {
  const SMILE_THRESHOLD = 0.3;
  return expressionData.mouthCurveAmount >= SMILE_THRESHOLD;
}

// Renderer function - draws the effect
function drawHearts(intensity, centerX, centerY, canvas) {
  canvas.fill(255, 100, 150);
  canvas.circle(centerX, centerY - 50, 30);
  // ... your effect drawing code
}

// Register the effect
if (typeof effectManager !== 'undefined') {
  effectManager.registerEffect(
    'smile',        // unique name
    detectSmile,    // detector function
    drawHearts,     // renderer function
    { minDuration: 300 }  // options
  );
}
```

### 2. Load Your Effect File

Add one line to `index.html`:

```html
<script src="effects/hearts.js"></script>
```

### 3. Done!

That's it! Your effect now works for **both participants** automatically.

---

## Available Expression Data

Your detector function receives an `expressionData` object with:

- `browRaiseAmount` (0 to 1) - How much eyebrows are raised
- `mouthOpenRatio` (0 to 1+) - Mouth height / width ratio
- `mouthCurveAmount` (-1 to 1) - Negative = frown, Positive = smile

## Effect Options

```javascript
{
  minDuration: 200,   // Minimum ms to confirm (debouncing)
  debounce: true,     // Enable/disable debouncing
  priority: 0         // Higher = renders on top
}
```

## Examples

See `effects/speedlines.js` and `effects/hearts.js` for working examples!

---

## That's All!

No need to modify `sketch.js` or any core files. Just create your effect file and load it!
