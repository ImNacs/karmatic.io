/**
 * @fileoverview Avatar component for user profile images
 * @module components/ui/avatar
 */

"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * Avatar container component
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Avatar container
 * @example
 * ```tsx
 * <Avatar>
 *   <AvatarImage src="/avatar.jpg" alt="User" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 * ```
 */
function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

/**
 * Avatar image component with automatic loading state
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alternative text for accessibility
 * @returns {JSX.Element} Avatar image element
 */
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

/**
 * Avatar fallback content when image fails to load
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Fallback content (usually initials)
 * @returns {JSX.Element} Avatar fallback element
 */
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
