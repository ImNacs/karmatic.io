/**
 * @fileoverview Progress bar component for showing completion status
 * @module components/ui/progress
 */

"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * Progress bar component with animated fill
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.value] - Progress value (0-100)
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element} Progress bar element
 * @example
 * ```tsx
 * // Basic progress
 * <Progress value={33} />
 * 
 * // Custom styled progress
 * <Progress value={66} className="h-2" />
 * ```
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }