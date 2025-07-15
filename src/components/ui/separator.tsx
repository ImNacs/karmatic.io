/**
 * @fileoverview Visual separator component for dividing content
 * @module components/ui/separator
 */

"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

/**
 * Visual separator for dividing sections of content
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {"horizontal" | "vertical"} [props.orientation="horizontal"] - Separator direction
 * @param {boolean} [props.decorative=true] - Whether separator is decorative (non-semantic)
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element} Separator element
 * @example
 * ```tsx
 * // Horizontal separator
 * <Separator />
 * 
 * // Vertical separator
 * <Separator orientation="vertical" className="h-4" />
 * ```
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }