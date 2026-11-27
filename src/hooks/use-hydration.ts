import { useState, useEffect } from 'react';

/**
 * Hook para verificar se o componente foi hidratado no cliente
 * Útil para evitar erros de hidratação ao usar APIs do browser
 */
export const useHydration = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};

/**
 * Hook para usar localStorage de forma segura, evitando erros de hidratação
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const isHydrated = useHydration();
  
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, isHydrated]);

  const setValue = (value: T | ((val: T) => T)) => {
    if (!isHydrated) return;

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};