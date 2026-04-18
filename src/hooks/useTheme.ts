import { useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('organizer-theme', 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.add('theme-light')
    else root.classList.remove('theme-light')
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, setTheme, toggle }
}
