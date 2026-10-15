'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ahorrar-theme'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#14201b' : '#0f9d6f')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') {
      setThemeState('dark')
      applyTheme('dark')
    }
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage may be unavailable (private mode); the theme still applies for this session.
    }
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
