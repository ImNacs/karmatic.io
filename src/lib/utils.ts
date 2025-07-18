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

/**
 * Format a date to a relative time string
 * @param {Date} date - The date to format
 * @returns {string} Relative time string (e.g., "hace 2 horas")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'hace un momento'
  if (diffInMinutes < 60) return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
  if (diffInHours < 24) return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  if (diffInDays < 7) return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  }
  const years = Math.floor(diffInDays / 365)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}
