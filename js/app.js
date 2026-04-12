/* ============================================
   DENTAVIZION — App Initialization
   Landing page logic, mode selection, routing
   ============================================ */

const DentaApp = (() => {
  'use strict';

  // ── DOM References ──
  let modeVisualBtn = null;
  let modeAudioBtn = null;
  let installBannerClose = null;
  let installBannerAction = null;

  // ── Initialization ──
  function init() {
    // Clear saved mode — landing page is always a fresh choice
    localStorage.removeItem('dentavizion-mode');

    cacheDOM();
    bindEvents();
    addLoadingAnimation();

    console.log('[App] DENTAVIZION initialized');
  }

  function cacheDOM() {
    modeVisualBtn = document.getElementById('mode-visual');
    modeAudioBtn = document.getElementById('mode-audio');
    installBannerClose = document.getElementById('install-banner-close');
    installBannerAction = document.getElementById('install-banner-action');
  }

  // ── Event Binding ──
  function bindEvents() {
    // Mode selection
    if (modeVisualBtn) {
      modeVisualBtn.addEventListener('click', () => selectMode('visual'));
      modeVisualBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectMode('visual');
        }
      });
    }

    if (modeAudioBtn) {
      modeAudioBtn.addEventListener('click', () => selectMode('blind'));
      modeAudioBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectMode('blind');
        }
      });
    }

    // Install banner
    if (installBannerClose) {
      installBannerClose.addEventListener('click', () => {
        DentaPWA.hideInstallBanner();
      });
    }

    if (installBannerAction) {
      installBannerAction.addEventListener('click', () => {
        DentaPWA.promptInstall();
      });
    }

    // Keyboard navigation enhancement
    document.addEventListener('keydown', handleGlobalKeyboard);
  }

  // ── Mode Selection ──
  function selectMode(mode) {
    // Visual feedback
    const selectedCard = mode === 'visual' ? modeVisualBtn : modeAudioBtn;
    if (selectedCard) {
      selectedCard.style.transform = 'scale(0.95)';
      setTimeout(() => {
        selectedCard.style.transform = '';
      }, 150);
    }

    // Set accessibility mode
    DentaA11y.setMode(mode);

    // Haptic feedback
    DentaA11y.vibrate('confirm');

    // Navigate to home page after a brief delay
    setTimeout(() => {
      navigateToHome(mode);
    }, 600);
  }

  function checkExistingMode() {
    const savedMode = DentaA11y.getMode();
    if (savedMode) {
      // If mode already selected, highlight the active card
      const activeCard = savedMode === 'visual' ? modeVisualBtn : modeAudioBtn;
      if (activeCard) {
        activeCard.setAttribute('aria-pressed', 'true');
      }
    }
  }

  // ── Navigation ──
  function navigateToHome(mode) {
    // For MVP, navigate to home page
    // In the future, this will use the SPA router
    const homeUrl = `/pages/home.html?mode=${mode}`;
    
    // Announce navigation
    DentaA11y.announceToScreenReader('Memuat halaman utama...');
    
    // Show a brief loading state
    document.body.style.opacity = '0.7';
    document.body.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
      window.location.href = homeUrl;
    }, 300);
  }

  // ── Loading Animations ──
  function addLoadingAnimation() {
    // Add staggered entrance animations to elements
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.animateDelay || '0';
          entry.target.style.animationDelay = `${delay}ms`;
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
  }

  // ── Global Keyboard Handling ──
  function handleGlobalKeyboard(e) {
    // Tab trap prevention — ensure focus stays in meaningful areas
    
    // '1' key shortcut for visual mode
    if (e.key === '1' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const focused = document.activeElement;
      if (focused.tagName !== 'INPUT' && focused.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (modeVisualBtn) {
          modeVisualBtn.focus();
          DentaA11y.vibrate('navigation');
        }
      }
    }

    // '2' key shortcut for audio mode
    if (e.key === '2' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const focused = document.activeElement;
      if (focused.tagName !== 'INPUT' && focused.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (modeAudioBtn) {
          modeAudioBtn.focus();
          DentaA11y.vibrate('navigation');
        }
      }
    }
  }

  // ── Public API ──
  return {
    init,
    selectMode,
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  DentaApp.init();
});
