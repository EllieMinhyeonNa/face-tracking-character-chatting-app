// Events detection - LEGACY FILE (kept for backward compatibility)
// New effects should use the EffectManager system instead

/**
 * DEPRECATED: Use effectManager.processEffects() instead
 * Detects "surprised" expression (backward compatibility)
 * @param {number} browRaiseAmount - 0 to 1, eyebrow raise detection value
 * @param {number} mouthOpenRatio - mouth height / mouth width ratio
 * @returns {boolean} true if surprised expression detected
 */
function detectSurprised(browRaiseAmount, mouthOpenRatio) {
  // This is now just a wrapper for backward compatibility
  // The actual detection is handled by EffectManager
  const BROW_THRESHOLD = 0.15;
  const MOUTH_THRESHOLD = 0.15;
  return browRaiseAmount >= BROW_THRESHOLD && mouthOpenRatio >= MOUTH_THRESHOLD;
}

/**
 * Get current event states for debugging
 * @returns {object} Current state of all events
 */
function getEventStates() {
  if (typeof effectManager !== 'undefined') {
    return effectManager.getStates();
  }
  return {};
}
