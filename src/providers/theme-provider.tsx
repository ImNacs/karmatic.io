/**
 * @fileoverview Theme provider wrapper for next-themes
 * @module providers/theme-provider
 */

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Props for ThemeProvider component
 * @interface ThemeProviderProps
 */
interface ThemeProviderProps {
  /** Child components to wrap with theme context */
  children: React.ReactNode
  /** HTML attribute to set theme class (default: 'class') */
  attribute?: string
  /** Default theme when no preference is set */
  defaultTheme?: string
  /** Enable system theme detection */
  enableSystem?: boolean
  /** Disable CSS transitions when changing themes */
  disableTransitionOnChange?: boolean
}

/**
 * Theme provider component for managing light/dark themes
 * @component
 * @param {ThemeProviderProps} props - Component props
 * @returns {JSX.Element} Theme provider wrapper
 * @example
 * ```tsx
 * <ThemeProvider
 *   attribute="class"
 *   defaultTheme="system"
 *   enableSystem
 * >
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <NextThemesProvider {...(props as any)}>{children}</NextThemesProvider>
}