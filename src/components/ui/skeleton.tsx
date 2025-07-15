/**
 * @fileoverview Skeleton loading placeholder component
 * @module components/ui/skeleton
 */

import { cn } from "@/lib/utils"

/**
 * Loading skeleton placeholder component
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Animated skeleton placeholder
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton className="h-4 w-[250px]" />
 * 
 * // Card skeleton
 * <div className="space-y-2">
 *   <Skeleton className="h-4 w-[250px]" />
 *   <Skeleton className="h-4 w-[200px]" />
 * </div>
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }