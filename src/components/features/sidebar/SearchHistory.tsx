/**
 * @fileoverview Search History component for VerticalSidebar
 * @module components/features/sidebar/SearchHistory
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { FiClock, FiMapPin, FiSearch } from 'react-icons/fi'
import { formatDistanceToNow } from '@/lib/utils'

interface SearchHistoryItem {
  id: string
  query: string
  location?: string
  createdAt: Date
  resultCount?: number
}

/**
 * SearchHistory - Shows user's recent searches
 */
export function SearchHistory() {
  const { user } = useUser()
  const [searches, setSearches] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSearchHistory()
    }
  }, [user])

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('/api/search-history')
      if (response.ok) {
        const data = await response.json()
        setSearches(data.searches || [])
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Historial de búsquedas</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Historial de búsquedas</h3>
        <p className="text-xs text-muted-foreground text-center py-8">
          Inicia sesión para ver tu historial
        </p>
      </div>
    )
  }

  if (searches.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Historial de búsquedas</h3>
        <div className="text-center py-8">
          <FiSearch className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No hay búsquedas recientes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Historial de búsquedas</h3>
      <div className="space-y-1">
        {searches.slice(0, 5).map((search) => (
          <Link
            key={search.id}
            href={`/explorer/${search.id}`}
            className="block p-2 rounded-lg hover:bg-accent/30 transition-all duration-200 group"
          >
            <div className="flex items-start space-x-2">
              <FiClock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary">
                  {search.query}
                </p>
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  {search.location && (
                    <span className="flex items-center space-x-1">
                      <FiMapPin className="w-3 h-3" />
                      <span className="truncate">{search.location}</span>
                    </span>
                  )}
                  <span>{formatDistanceToNow(new Date(search.createdAt))}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}