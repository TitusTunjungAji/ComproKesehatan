/* ============================================
   DENTAVIZION — PWA Registration & Install
   Service Worker registration, install prompt
   ============================================ */

const DentaPWA = (() => {
  'use strict';

  let deferredPrompt = null;
  let isInstalled = false;

  // ── Register Service Worker ──
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[PWA] New Service Worker activated');
            // Optionally show "update available" toast
            showUpdateToast();
          }
        });
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  // ── Install Prompt ──
  function initInstallPrompt() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      isInstalled = true;
      console.log('[PWA] App is already installed');
      return;
    }

    // Capture the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[PWA] Install prompt captured');

      // Show install banner after a delay
      setTimeout(() => {
        showInstallBanner();
      }, 3000);
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      isInstalled = true;
      deferredPrompt = null;
      hideInstallBanner();
      console.log('[PWA] App installed successfully');

      // Celebrate!
      if (typeof DentaA11y !== 'undefined') {
        DentaA11y.vibrate('confirm');
        DentaA11y.speak('Aplikasi DENTAVIZION berhasil dipasang!');
      }
    });
  }

  // ── Install Banner UI ──
  function showInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner && !isInstalled) {
      banner.classList.add('install-banner--visible');

      // Announce to screen reader
      if (typeof DentaA11y !== 'undefined') {
        DentaA11y.announceToScreenReader(
          'DENTAVIZION dapat dipasang di perangkat Anda untuk akses offline.'
        );
      }
    }
  }

  function hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.classList.remove('install-banner--visible');
    }
  }

  // ── Trigger Install ──
  async function promptInstall() {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);

    deferredPrompt = null;
    return outcome === 'accepted';
  }

  // ── Update Toast ──
  function showUpdateToast() {
    // Create toast if doesn't exist
    let toast = document.getElementById('pwa-update-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pwa-update-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = 'Versi baru tersedia! Muat ulang untuk memperbarui.';
      document.body.appendChild(toast);

      toast.addEventListener('click', () => {
        window.location.reload();
      });
    }

    setTimeout(() => {
      toast.classList.add('toast--visible');
    }, 100);

    // Auto-hide after 8 seconds
    setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 8000);
  }

  // ── Public API ──
  return {
    init() {
      registerServiceWorker();
      initInstallPrompt();
    },
    promptInstall,
    showInstallBanner,
    hideInstallBanner,
    get isInstalled() { return isInstalled; }
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  DentaPWA.init();
});
