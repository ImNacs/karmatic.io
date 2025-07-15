/**
 * @fileoverview Toast notification component using Sonner
 * @module components/ui/sonner
 */

"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * Toast notification container with theme support
 * @component
 * @param {ToasterProps} props - Sonner toaster props
 * @returns {JSX.Element} Themed toast container
 * @example
 * ```tsx
 * // In layout.tsx
 * <Toaster position="bottom-right" />
 * 
 * // Usage in components
 * import { toast } from 'sonner'
 * toast.success('Operation completed!')
 * toast.error('Something went wrong')
 * ```
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
