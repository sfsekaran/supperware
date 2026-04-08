import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    if (enabled) {
      navigator.wakeLock.request('screen').then((l) => { lock.current = l; }).catch(() => {});
    } else {
      lock.current?.release();
      lock.current = null;
    }
    return () => { lock.current?.release(); lock.current = null; };
  }, [enabled]);
}

export const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
