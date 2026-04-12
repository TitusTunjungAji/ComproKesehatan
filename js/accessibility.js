/* ============================================
   DENTAVIZION — Accessibility Module
   Web Speech API (TTS), Vibration API,
   Screen Reader detection, Mode management
   ============================================ */

const DentaA11y = (() => {
  'use strict';

  // ── State ──
  let currentMode = null; // 'visual' | 'blind'
  let ttsEnabled = false;
  let hapticEnabled = false;
  let speechSynth = null;
  let currentUtterance = null;

  // ── Initialization ──
  function init() {
    // Check for saved mode
    const savedMode = localStorage.getItem('dentavizion-mode');
    if (savedMode) {
      currentMode = savedMode;
      applyMode(currentMode);
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      speechSynth = window.speechSynthesis;
      ttsEnabled = true;
    }

    // Check Vibration API support
    if ('vibrate' in navigator) {
      hapticEnabled = true;
    }

    // Detect screen reader (heuristic)
    detectScreenReader();

    console.log('[A11y] Initialized — TTS:', ttsEnabled, '| Haptic:', hapticEnabled);
  }

  // ── Mode Management ──
  function setMode(mode) {
    if (mode !== 'visual' && mode !== 'blind') {
      console.error('[A11y] Invalid mode:', mode);
      return;
    }

    currentMode = mode;
    localStorage.setItem('dentavizion-mode', mode);
    applyMode(mode);

    // Announce mode change
    if (mode === 'blind') {
      speak('Mode Audio diaktifkan. Navigasi dengan sentuhan dan suara.', true);
      vibrate('confirm');
    } else {
      // Visual mode — no TTS (deaf users), only haptic
      vibrate('tap');
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('dentavizion:modechange', {
      detail: { mode }
    }));
  }

  function getMode() {
    return currentMode;
  }

  function applyMode(mode) {
    document.documentElement.setAttribute('data-mode', mode);

    if (mode === 'blind') {
      // Enhance focus visibility
      document.body.classList.add('mode-blind');
      // Enable auto-reading of focused elements
      enableAutoRead();
    } else {
      document.body.classList.remove('mode-blind');
      disableAutoRead();
    }
  }

  // ── Text-to-Speech ──
  function speak(text, interrupt = false) {
    if (!ttsEnabled || !speechSynth) {
      console.warn('[A11y] TTS not available');
      return;
    }

    // Cancel current speech if interrupt
    if (interrupt) {
      speechSynth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID'; // Indonesian
    utterance.rate = 0.9;      // Slightly slower for clarity
    utterance.pitch = 1.1;     // Slightly higher, friendly tone
    utterance.volume = 1.0;

    // Try to find Indonesian voice
    const voices = speechSynth.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id')) ||
                    voices.find(v => v.lang.startsWith('ms')) || // Malay fallback
                    null;
    if (idVoice) {
      utterance.voice = idVoice;
    }

    currentUtterance = utterance;
    speechSynth.speak(utterance);

    return utterance;
  }

  function stopSpeaking() {
    if (speechSynth) {
      speechSynth.cancel();
      currentUtterance = null;
    }
  }

  function isSpeaking() {
    return speechSynth ? speechSynth.speaking : false;
  }

  // ── Haptic Feedback ──
  const VIBRATION_PATTERNS = {
    tap: [30],                          // Quick single tap
    doubleTap: [30, 50, 30],            // Double tap
    confirm: [50, 30, 80],              // Success confirmation
    error: [100, 50, 100, 50, 100],     // Error / warning
    navigation: [20],                    // Navigation cue
    timerTick: [15],                     // Timer tick
    timerEnd: [100, 50, 100, 50, 200],  // Timer complete
    attention: [50, 100, 50],            // Get attention
    longPress: [200],                    // Long press feedback
    brushLeft: [40, 30, 40, 30, 40],    // Brushing left motion
    brushRight: [30, 40, 30, 40, 30],   // Brushing right motion
  };

  function vibrate(pattern = 'tap') {
    if (!hapticEnabled) return;

    const vibratePattern = VIBRATION_PATTERNS[pattern] || VIBRATION_PATTERNS.tap;

    try {
      navigator.vibrate(vibratePattern);
    } catch (e) {
      console.warn('[A11y] Vibration failed:', e);
    }
  }

  function vibrateCustom(pattern) {
    if (!hapticEnabled) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('[A11y] Custom vibration failed:', e);
    }
  }

  function stopVibration() {
    if (hapticEnabled) {
      navigator.vibrate(0);
    }
  }

  // ── Screen Reader Detection ──
  function detectScreenReader() {
    // Heuristic detection methods
    const indicators = [
      // Check for reduced motion preference (common with screen readers)
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      // Check for forced colors (high contrast mode)
      window.matchMedia('(forced-colors: active)').matches,
    ];

    const likelyScreenReader = indicators.some(i => i);

    if (likelyScreenReader && !currentMode) {
      console.log('[A11y] Screen reader likely detected, suggesting blind mode');
      // Don't auto-set, but suggest via announcement
      announceToScreenReader(
        'Terdeteksi kemungkinan penggunaan pembaca layar. ' +
        'Pilih Mode Audio untuk pengalaman optimal dengan suara dan getaran.'
      );
    }
  }

  // ── Auto-Read on Focus (Blind Mode) ──
  let autoReadHandler = null;

  function enableAutoRead() {
    if (autoReadHandler) return;

    autoReadHandler = (e) => {
      const target = e.target;
      const readText = target.getAttribute('data-a11y-read') ||
                       target.getAttribute('aria-label') ||
                       target.textContent?.trim();

      if (readText && readText.length > 0) {
        speak(readText, true);
        vibrate('navigation');
      }
    };

    document.addEventListener('focusin', autoReadHandler);
  }

  function disableAutoRead() {
    if (autoReadHandler) {
      document.removeEventListener('focusin', autoReadHandler);
      autoReadHandler = null;
    }
  }

  // ── Live Region Announcements ──
  function announceToScreenReader(message, priority = 'polite') {
    let announcer = document.getElementById('a11y-announcer');

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.className = 'a11y-announcement';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
      document.body.appendChild(announcer);
    }

    // Clear and re-set for screen readers to pick up change
    announcer.textContent = '';
    requestAnimationFrame(() => {
      announcer.textContent = message;
    });
  }

  // ── Public API ──
  return {
    init,
    setMode,
    getMode,
    speak,
    stopSpeaking,
    isSpeaking,
    vibrate,
    vibrateCustom,
    stopVibration,
    announceToScreenReader,
    get ttsAvailable() { return ttsEnabled; },
    get hapticAvailable() { return hapticEnabled; },
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  DentaA11y.init();
});

// Ensure voices are loaded (Chrome fires this async)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    console.log('[A11y] Voices loaded:', speechSynthesis.getVoices().length);
  };
}
