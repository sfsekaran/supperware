import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const lock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    async function acquire() {
      try {
        lock.current = await navigator.wakeLock.request('screen');
      } catch { /* denied or page not visible — ignore */ }
    }

    function release() {
      lock.current?.release();
      lock.current = null;
    }

    // Re-acquire when the page becomes visible again (after phone sleep / tab switch)
    function onVisibilityChange() {
      if (enabled && document.visibilityState === 'visible') {
        acquire();
      }
    }

    if (enabled) {
      acquire();
      document.addEventListener('visibilitychange', onVisibilityChange);
    } else {
      release();
    }

    return () => {
      release();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);
}

export const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
