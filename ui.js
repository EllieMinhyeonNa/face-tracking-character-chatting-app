// UI Controller for the video chat interface

let startTime = null;
let durationInterval = null;

/**
 * Initialize UI elements and event listeners
 */
function initUI() {
  // Control buttons
  const muteBtn = document.getElementById('mute-btn');
  const videoBtn = document.getElementById('video-btn');
  const endCallBtn = document.getElementById('end-call-btn');

  // Button click handlers (placeholders for now)
  muteBtn.addEventListener('click', () => {
    console.log('Mute clicked');
    // TODO: Implement mute functionality
  });

  videoBtn.addEventListener('click', () => {
    console.log('Video toggle clicked');
    // TODO: Implement video toggle
  });

  endCallBtn.addEventListener('click', () => {
    console.log('End call clicked');
    // Could reload page or show disconnect message
    if (confirm('End the call?')) {
      window.location.reload();
    }
  });

  // Start duration timer
  startDurationTimer();
}

/**
 * Show or hide the second participant box
 */
function showSecondParticipant(show) {
  const participantBox = document.getElementById('participant-2');
  if (participantBox) {
    participantBox.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Start the duration timer
 */
function startDurationTimer() {
  startTime = Date.now();

  durationInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const display = document.getElementById('duration-display');
    if (display) {
      display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

/**
 * Update UI when connection status changes
 */
function updateConnectionUI(connected) {
  showSecondParticipant(connected);
}

// Initialize UI when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}
