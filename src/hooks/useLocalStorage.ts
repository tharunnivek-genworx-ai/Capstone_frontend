// src/hooks/useLocalStorage.ts
/**
 * Generic typed hook for interacting with localStorage.
 * Provides get, set, and remove with JSON serialization.
 */

import { useState, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`useLocalStorage: error setting key "${key}"`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`useLocalStorage: error removing key "${key}"`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
