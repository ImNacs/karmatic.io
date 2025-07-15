/**
 * @fileoverview Utility functions for the application
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge CSS classes with Tailwind CSS conflict resolution
 * @param {...ClassValue[]} inputs - Class names to merge
 * @returns {string} Merged class string with conflicts resolved
 * @example
 * ```ts
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // Conditional classes
 * cn(['text-sm', 'font-bold'], { 'opacity-50': isDisabled }) // Arrays and objects
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
