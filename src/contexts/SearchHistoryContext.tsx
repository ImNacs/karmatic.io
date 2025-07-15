/**
 * @fileoverview Search history context with optimistic updates
 * @module contexts/SearchHistoryContext
 */

'use client'

import React, { createContext, useContext, useState, useOptimistic, useCallback, startTransition } from 'react'
import { nanoid } from 'nanoid'
import useSWR from 'swr'

/**
 * Individual search history item
 * @interface SearchItem
 */
interface SearchItem {
  /** Unique search ID */
  id: string
  /** Search location */
  location: string
  /** Optional search query */
  query: string | null
  /** ISO timestamp */
  createdAt: string
}

/**
 * Grouped searches by time period
 * @interface SearchGroup
 */
interface SearchGroup {
  /** Group label (e.g., "Hoy", "Ayer") */
  label: string
  /** Searches in this group */
  searches: SearchItem[]
}

/**
 * Search history context value
 * @interface SearchHistoryContextType
 */
interface SearchHistoryContextType {
  /** Grouped search history */
  history: SearchGroup[]
  /** Loading state */
  isLoading: boolean
  /** Add search with optimistic update */
  addOptimisticSearch: (search: Omit<SearchItem, 'id' | 'createdAt'>) => string
  /** Refresh history from server */
  refreshHistory: () => Promise<void>
  /** Update temporary ID with real ID */
  updateSearchId: (tempId: string, realId: string) => void
  /** Delete search from history */
  deleteSearch: (searchId: string) => Promise<void>
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined)

/**
 * Hook to access search history context
 * @returns {SearchHistoryContextType} Search history context value
 * @throws {Error} If used outside SearchHistoryProvider
 * @example
 * ```tsx
 * const { history, addOptimisticSearch, deleteSearch } = useSearchHistory();
 * ```
 */
export function useSearchHistory() {
  const context = useContext(SearchHistoryContext)
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider')
  }
  return context
}

/**
 * Insert search at the top of history maintaining group structure
 * @param {SearchGroup[]} history - Current history groups
 * @param {SearchItem} newSearch - New search to insert
 * @returns {SearchGroup[]} Updated history with search inserted
 */
function insertSearchAtTop(history: SearchGroup[], newSearch: SearchItem): SearchGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Clone the history to avoid mutations
  const updatedHistory = history.map(group => ({
    ...group,
    searches: [...group.searches]
  }))
  
  // Find or create "Today" group
  let todayGroup = updatedHistory.find(group => group.label === 'Hoy')
  
  if (!todayGroup) {
    todayGroup = { label: 'Hoy', searches: [] }
    updatedHistory.unshift(todayGroup)
  }
  
  // Remove any existing search with the same ID to prevent duplicates
  todayGroup.searches = todayGroup.searches.filter(s => s.id !== newSearch.id)
  
  // Add new search at the beginning of today's searches
  todayGroup.searches.unshift(newSearch)
  
  return updatedHistory
}

/**
 * SWR fetcher for search history API
 * @param {string} url - API endpoint URL
 * @returns {Promise<SearchGroup[]>} Search history groups
 */
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url, {
      credentials: 'include', // Include cookies for anonymous tracking
    })
    if (!res.ok) {
      console.error('Failed to fetch search history:', res.status)
      throw new Error('Failed to fetch')
    }
    const data = await res.json()
    console.log('Fetched search history:', data)
    return data.searches || []
  } catch (error) {
    console.error('Error in fetcher:', error)
    return []
  }
}

/**
 * Search history provider with SWR caching and optimistic updates
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 * @example
 * ```tsx
 * <SearchHistoryProvider>
 *   <App />
 * </SearchHistoryProvider>
 * ```
 */
export function SearchHistoryProvider({ children }: { children: React.ReactNode }) {
  // Use SWR for efficient caching and automatic revalidation
  const { data: history = [], isLoading, mutate } = useSWR<SearchGroup[]>(
    '/api/search/history',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Dedupe requests for 1 minute
      refreshInterval: 0, // No automatic refresh
    }
  )
  
  // Use React 19's useOptimistic for instant updates
  const [optimisticHistory, addOptimistic] = useOptimistic(
    history,
    (currentHistory: SearchGroup[], optimisticValue: SearchItem) => {
      return insertSearchAtTop(currentHistory, optimisticValue)
    }
  )
  
  // Add optimistic search with temporary ID
  const addOptimisticSearch = useCallback((search: Omit<SearchItem, 'id' | 'createdAt'>) => {
    const tempId = nanoid()
    const newSearch: SearchItem = {
      ...search,
      id: tempId,
      createdAt: new Date().toISOString()
    }
    
    // Wrap optimistic update in startTransition
    startTransition(() => {
      // Add to optimistic state immediately
      addOptimistic(newSearch)
    })
    
    // Also update SWR cache to prevent flicker when optimistic state resolves
    mutate((currentData) => {
      if (!currentData) return insertSearchAtTop([], newSearch)
      return insertSearchAtTop(currentData, newSearch)
    }, {
      revalidate: false // Don't refetch from server
    })
    
    return tempId
  }, [addOptimistic, mutate])
  
  // Update temporary ID with real ID after server response
  const updateSearchId = useCallback((tempId: string, realId: string) => {
    // Update the optimistic data with real ID without refetching
    mutate((currentData) => {
      if (!currentData) return currentData
      
      return currentData.map(group => ({
        ...group,
        searches: group.searches.map(search => 
          search.id === tempId ? { ...search, id: realId } : search
        )
      }))
    }, {
      revalidate: false // Don't refetch from server
    })
  }, [mutate])
  
  // Refresh history from server
  const refreshHistory = useCallback(async () => {
    await mutate()
  }, [mutate])
  
  // Delete a search from history
  const deleteSearch = useCallback(async (searchId: string) => {
    // Optimistic update - remove immediately from UI
    startTransition(() => {
      mutate((currentData) => {
        if (!currentData) return currentData
        
        return currentData.map(group => ({
          ...group,
          searches: group.searches.filter(search => search.id !== searchId)
        })).filter(group => group.searches.length > 0)
      }, {
        revalidate: false // Don't refetch immediately
      })
    })
    
    try {
      // Delete from server
      const response = await fetch(`/api/search/history/${searchId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.error('Failed to delete search:', response.status)
        // Revalidate to restore the item if delete failed
        mutate()
      }
    } catch (error) {
      console.error('Error deleting search:', error)
      // Revalidate to restore the item
      mutate()
    }
  }, [mutate])
  
  const value: SearchHistoryContextType = {
    history: optimisticHistory,
    isLoading,
    addOptimisticSearch,
    refreshHistory,
    updateSearchId,
    deleteSearch
  }
  
  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  )
}