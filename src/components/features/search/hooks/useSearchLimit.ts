'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * Search limit state interface that provides comprehensive information
 * about the user's search quota and authentication status.
 */
interface SearchLimit {
  /** Number of searches remaining in the current period */
  remaining: number
  /** Total searches allowed per period (1 for anonymous, Infinity for authenticated) */
  total: number
  /** Whether the user is authenticated via Clerk */
  isAuthenticated: boolean
  /** Computed property indicating if the user can perform a search */
  canSearch: boolean
  /** Loading state while checking limits with the API */
  loading: boolean
}

/**
 * Custom React hook for managing search limits and quotas.
 * 
 * This hook provides a unified interface for:
 * - Checking current search limits
 * - Monitoring authentication status
 * - Refreshing limit information
 * - Providing UI feedback during loading states
 * 
 * The hook automatically syncs with the backend on mount and when
 * authentication status changes, ensuring the UI always reflects
 * the current limit status.
 * 
 * @returns {SearchLimit & { refreshLimit: () => Promise<void> }} Current limit status and refresh function
 * 
 * @example
 * ```typescript
 * function SearchBar() {
 *   const { remaining, canSearch, loading, refreshLimit } = useSearchLimit();
 *   
 *   const handleSearch = async () => {
 *     if (!canSearch) {
 *       showUpgradePrompt();
 *       return;
 *     }
 *     
 *     await performSearch();
 *     await refreshLimit(); // Update UI after search
 *   };
 *   
 *   if (loading) return <Skeleton />;
 *   
 *   return (
 *     <div>
 *       <SearchInput disabled={!canSearch} />
 *       <span>{remaining} searches remaining</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearchLimit() {
  const { user, isLoaded } = useUser()
  const [limit, setLimit] = useState<SearchLimit>({
    remaining: 1,
    total: 1,
    isAuthenticated: false,
    canSearch: true,
    loading: true,
  })

  useEffect(() => {
    async function checkLimit() {
      if (!isLoaded) return

      try {
        const response = await fetch('/api/search/check-limit')
        if (response.ok) {
          const data = await response.json()
          setLimit({
            ...data,
            loading: false,
          })
        }
      } catch (error) {
        console.error('Error checking search limit:', error)
        setLimit(prev => ({ ...prev, loading: false }))
      }
    }

    checkLimit()
  }, [user, isLoaded])

  /**
   * Manually refreshes the search limit from the server.
   * 
   * This function is useful after performing a search to immediately
   * update the UI with the new remaining count. It maintains loading
   * state during the refresh operation.
   * 
   * @returns {Promise<void>}
   */
  const refreshLimit = async () => {
    setLimit(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch('/api/search/check-limit')
      if (response.ok) {
        const data = await response.json()
        setLimit({
          ...data,
          loading: false,
        })
      }
    } catch (error) {
      console.error('Error refreshing search limit:', error)
      setLimit(prev => ({ ...prev, loading: false }))
    }
  }

  return {
    ...limit,
    refreshLimit,
  }
}