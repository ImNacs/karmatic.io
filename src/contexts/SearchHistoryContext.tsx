'use client'

import React, { createContext, useContext, useState, useOptimistic, useCallback } from 'react'
import { nanoid } from 'nanoid'
import useSWR from 'swr'

interface SearchItem {
  id: string
  location: string
  query: string | null
  createdAt: string
}

interface SearchGroup {
  label: string
  searches: SearchItem[]
}

interface SearchHistoryContextType {
  history: SearchGroup[]
  isLoading: boolean
  addOptimisticSearch: (search: Omit<SearchItem, 'id' | 'createdAt'>) => string
  refreshHistory: () => Promise<void>
  updateSearchId: (tempId: string, realId: string) => void
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined)

export function useSearchHistory() {
  const context = useContext(SearchHistoryContext)
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider')
  }
  return context
}

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
  
  // Add new search at the beginning of today's searches
  todayGroup.searches.unshift(newSearch)
  
  return updatedHistory
}

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  const data = await res.json()
  return data.searches || []
}

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
      revalidateOnMount: false, // Don't refetch on mount if data exists
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
    
    // Add to optimistic state immediately
    addOptimistic(newSearch)
    
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
  
  const value: SearchHistoryContextType = {
    history: optimisticHistory,
    isLoading,
    addOptimisticSearch,
    refreshHistory,
    updateSearchId
  }
  
  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  )
}