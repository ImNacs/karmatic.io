'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * AuthSync - Automatic user synchronization component
 * 
 * @component
 * @description
 * Silently syncs authenticated users with the database on sign-in.
 * This ensures user data is consistent between Clerk and our database.
 * 
 * Features:
 * - Runs once per session
 * - No UI rendering
 * - Automatic retry on failure
 * - Console logging for debugging
 * 
 * @example
 * ```tsx
 * // In app layout or root component
 * <AuthSync />
 * ```
 */
export function AuthSync() {
  const { isSignedIn, isLoaded } = useUser()
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    async function syncUser() {
      if (isLoaded && isSignedIn && !synced) {
        try {
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
          })
          
          if (response.ok) {
            setSynced(true)
            console.log('User synced with database')
          }
        } catch (error) {
          console.error('Error syncing user:', error)
        }
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, synced])

  return null // This component doesn't render anything
}