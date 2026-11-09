import { useState, useEffect, useCallback } from 'react';

// Store prompt at module level so it persists across re-renders and component mounts
let globalDeferredPrompt: any = null;

// Helper to check if currently running in standalone (installed PWA) mode
const checkIsRunningStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('source=pwa')
  );
};

// Helper to check if previously marked as installed in localStorage
const checkIsLocallyInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('lumefit_pwa_installed') === 'true';
  } catch {
    return false;
  }
};

// Immediate module-level listener so beforeinstallprompt is NEVER missed
if (typeof window !== 'undefined') {
  // If loaded as standalone, ensure it is recorded immediately
  if (checkIsRunningStandalone()) {
    try {
      localStorage.setItem('lumefit_pwa_installed', 'true');
    } catch {}
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem('lumefit_pwa_installed', 'true');
    } catch {}
  });
}

export function usePWAInstall() {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsRunningStandalone());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsRunningStandalone() || checkIsLocallyInstalled());
  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    );
  });
  const [isAndroid, setIsAndroid] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /android/.test(window.navigator.userAgent.toLowerCase());
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const standaloneMode = checkIsRunningStandalone();
    setIsStandalone(standaloneMode);
    if (standaloneMode) {
      setIsInstalled(true);
      try {
        localStorage.setItem('lumefit_pwa_installed', 'true');
      } catch {}
    }

    // Check device OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    setIsAndroid(/android/.test(ua));

    // Chromium API to check if PWA is already installed on device
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps()
        .then((apps: any[]) => {
          if (apps && apps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem('lumefit_pwa_installed', 'true');
            } catch {}
          }
        })
        .catch(() => {});
    }

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      try {
        localStorage.setItem('lumefit_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Watch for display-mode changes (e.g. launched or installed in real time)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        try {
          localStorage.setItem('lumefit_pwa_installed', 'true');
        } catch {}
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> => {
    let promptToUse = deferredPrompt || globalDeferredPrompt;

    // If on Android/Chromium and prompt hasn't arrived yet, wait briefly up to 1200ms
    if (!promptToUse && !isIOS) {
      promptToUse = await new Promise<any>((resolve) => {
        if (globalDeferredPrompt) return resolve(globalDeferredPrompt);
        const handler = (e: any) => {
          e.preventDefault();
          globalDeferredPrompt = e;
          window.removeEventListener('beforeinstallprompt', handler);
          resolve(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        setTimeout(() => {
          window.removeEventListener('beforeinstallprompt', handler);
          resolve(null);
        }, 1200);
      });
    }

    if (promptToUse) {
      try {
        promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice && choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
          try {
            localStorage.setItem('lumefit_pwa_installed', 'true');
          } catch {}
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err);
        return 'unavailable';
      }
    }

    if (isIOS) {
      return 'ios';
    }

    return 'unavailable';
  }, [deferredPrompt, isIOS]);

  return {
    deferredPrompt: deferredPrompt || globalDeferredPrompt,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    canPromptDirectly: Boolean(deferredPrompt || globalDeferredPrompt),
    triggerInstall,
  };
}
