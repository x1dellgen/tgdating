import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Screen } from '../shared/constants';

interface ScreenContextValue {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  redirectSource: 'anon' | null;
  setRedirectSource: (source: 'anon' | null) => void;
}

const ScreenContext = createContext<ScreenContextValue | null>(null);

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [redirectSource, setRedirectSource] = useState<'anon' | null>(null);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  return (
    <ScreenContext.Provider value={{ currentScreen, navigateTo, redirectSource, setRedirectSource }}>
      {children}
    </ScreenContext.Provider>
  );
}

export function useScreen(): ScreenContextValue {
  const ctx = useContext(ScreenContext);
  if (!ctx) {
    throw new Error('useScreen must be used within <ScreenProvider>');
  }
  return ctx;
}