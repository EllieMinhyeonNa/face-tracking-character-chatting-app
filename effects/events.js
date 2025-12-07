// Events detection - detects facial expression events and triggers effects

// Event state tracking
let eventState = {
  surprised: {
    active: false,
    tracking: false,  // Whether we're currently tracking a potential event
    startTime: 0,
    minDuration: 200  // Minimum duration in milliseconds to confirm event
  }
};

/**
 * Detects "surprised" expression
 * @param {number} browRaiseAmount - 0 to 1, eyebrow raise detection value
 * @param {number} mouthOpenRatio - mouth height / mouth width ratio
 * @returns {boolean} true if surprised expression detected
 */
function detectSurprised(browRaiseAmount, mouthOpenRatio) {
  // Thresholds for surprised expression
  const BROW_THRESHOLD = 0.15;   // 15% eyebrow raise
  const MOUTH_THRESHOLD = 0.15;  // 15% mouth opening (wide "O" shape)

  let isSurprised = browRaiseAmount >= BROW_THRESHOLD && mouthOpenRatio >= MOUTH_THRESHOLD;

  // Debounce: require minimum duration to confirm
  if (isSurprised) {
    if (!eventState.surprised.tracking) {
      // Start tracking
      eventState.surprised.tracking = true;
      eventState.surprised.startTime = millis();
      console.log('😲 Surprised detected! Waiting for confirmation...', {browRaiseAmount, mouthOpenRatio});
    }

    // Check if enough time has passed
    let elapsed = millis() - eventState.surprised.startTime;
    if (elapsed >= eventState.surprised.minDuration) {
      if (!eventState.surprised.active) {
        console.log('✅ Surprised CONFIRMED after', elapsed, 'ms');
      }
      eventState.surprised.active = true; // Confirmed!
    }
  } else {
    // Reset when expression is not detected
    if (eventState.surprised.active) {
      console.log('❌ Surprised ended');
    }
    eventState.surprised.active = false;
    eventState.surprised.tracking = false;
    eventState.surprised.startTime = 0;
  }

  return eventState.surprised.active;
}

/**
 * Get current event states for debugging
 * @returns {object} Current state of all events
 */
function getEventStates() {
  return eventState;
}
