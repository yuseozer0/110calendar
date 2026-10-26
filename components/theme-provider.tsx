'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemePreset = 'white' | 'black' | 'pink' | 'clean'
export type CalendarDensity = 'comfortable' | 'compact'

interface ThemePreferences {
  theme: ThemePreset
  density: CalendarDensity
}

interface ThemeContextValue extends ThemePreferences {
  setTheme: (theme: ThemePreset) => void
  setDensity: (density: CalendarDensity) => void
}

const STORAGE_KEY = '110calendar-theme'
const DEFAULTS: ThemePreferences = { theme: 'white', density: 'comfortable' }
const THEME_COLORS: Record<ThemePreset, string> = {
  white: '#f6f7f9',
  black: '#181818',
  pink: '#f8e8ef',
  clean: '#f3efe6',
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ThemePreferences> & { mode?: string }
        setPreferences({
          ...DEFAULTS,
          ...parsed,
          theme: parsed.theme ?? (parsed.mode === 'dark' ? 'black' : 'white'),
        })
      }
    } catch {
      // Keep defaults when local storage is unavailable or damaged.
    }
  }, [])

  useEffect(() => {
    const isBlack = preferences.theme === 'black'
    document.documentElement.classList.toggle('dark', isBlack)
    document.documentElement.classList.toggle('light', !isBlack)
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.dataset.density = preferences.density
    document.documentElement.style.colorScheme = isBlack ? 'dark' : 'light'
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = THEME_COLORS[preferences.theme]
    })
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const value = useMemo<ThemeContextValue>(() => ({
    ...preferences,
    setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
    setDensity: (density) => setPreferences((current) => ({ ...current, density })),
  }), [preferences])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemePreferences(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useThemePreferences must be used within ThemeProvider')
  return value
}
