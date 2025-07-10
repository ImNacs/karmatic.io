"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

/**
 * Hook to detect current theme with SSR safety
 * 
 * @returns {Object} Theme information
 * @property {boolean} isDarkMode - Whether dark mode is active
 * @property {string} theme - Current theme name
 * @property {boolean} mounted - Whether component is mounted (for SSR)
 */
export function useThemeDetection() {
  const [mounted, setMounted] = useState(false)
  const { theme, systemTheme } = useTheme()
  
  // Prevent hydration mismatch by only showing theme after mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Determine if dark mode is active
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDarkMode = currentTheme === 'dark'
  
  return {
    isDarkMode: mounted ? isDarkMode : false,
    theme: mounted ? currentTheme : 'light',
    mounted
  }
}