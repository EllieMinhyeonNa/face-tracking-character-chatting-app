// Effect Manager - Centralized system for managing facial expression effects
// Makes it easy to add new effects without modifying core code

class EffectManager {
  constructor() {
    this.effects = new Map(); // Map of effect name -> effect config
    this.eventStates = new Map(); // Map of event name -> state
  }

  /**
   * Register a new effect
   * @param {string} name - Unique effect name (e.g., 'surprised', 'smile')
   * @param {function} detector - Function(expressionData) => boolean that detects if effect should trigger
   * @param {function} renderer - Function(intensity, centerX, centerY, canvas) that draws the effect
   * @param {object} options - Optional configuration
   */
  registerEffect(name, detector, renderer, options = {}) {
    const defaultOptions = {
      minDuration: 200, // Minimum duration in ms to confirm event
      debounce: true,   // Whether to debounce the detection
      priority: 0       // Higher priority effects render last (on top)
    };

    this.effects.set(name, {
      name,
      detector,
      renderer,
      options: { ...defaultOptions, ...options }
    });

    // Initialize event state for this effect
    this.eventStates.set(name, {
      active: false,
      tracking: false,
      startTime: 0
    });

    console.log(`✅ Effect registered: ${name}`);
  }

  /**
   * Detect and render all effects for a participant
   * @param {object} expressionData - Expression data {browRaiseAmount, mouthOpenRatio, mouthCurveAmount, etc.}
   * @param {number} centerX - Center X position for effects
   * @param {number} centerY - Center Y position for effects
   * @param {object} canvas - p5 graphics canvas to render on
   */
  processEffects(expressionData, centerX, centerY, canvas) {
    if (!canvas) return;

    // Sort effects by priority (lower first, so higher priority renders on top)
    const sortedEffects = Array.from(this.effects.values())
      .sort((a, b) => a.options.priority - b.options.priority);

    // Process each effect
    for (const effect of sortedEffects) {
      const isTriggered = this._detectEffect(effect, expressionData);

      if (isTriggered) {
        // Calculate intensity (0 to 1) based on expression strength
        const intensity = this._calculateIntensity(effect, expressionData);

        // Render the effect
        effect.renderer(intensity, centerX, centerY, canvas);
      }
    }
  }

  /**
   * Detect if an effect should trigger
   * @private
   */
  _detectEffect(effect, expressionData) {
    const state = this.eventStates.get(effect.name);

    // Run the detector function
    const detected = effect.detector(expressionData);

    // If no debouncing, return immediately
    if (!effect.options.debounce) {
      state.active = detected;
      return detected;
    }

    // Debounce logic: require minimum duration to confirm
    if (detected) {
      if (!state.tracking) {
        // Start tracking
        state.tracking = true;
        state.startTime = millis();
      }

      // Check if enough time has passed
      const elapsed = millis() - state.startTime;
      if (elapsed >= effect.options.minDuration) {
        state.active = true;
        return true;
      }
    } else {
      // Reset when expression is not detected
      state.active = false;
      state.tracking = false;
      state.startTime = 0;
    }

    return state.active;
  }

  /**
   * Calculate effect intensity based on expression strength
   * @private
   */
  _calculateIntensity(effect, expressionData) {
    // For now, return 1.0 (full intensity)
    // Can be enhanced to calculate based on expression strength
    return 1.0;
  }

  /**
   * Get state of all effects (for debugging)
   */
  getStates() {
    const states = {};
    this.eventStates.forEach((state, name) => {
      states[name] = { ...state };
    });
    return states;
  }

  /**
   * Clear all effects (useful for cleanup)
   */
  clearAll() {
    this.effects.clear();
    this.eventStates.clear();
  }
}

// Create global effect manager instance
const effectManager = new EffectManager();
