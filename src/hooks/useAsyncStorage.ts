import { useEffect, useState } from 'react';

export function useAsyncStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignoră: storage plin / privacy mode etc.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
