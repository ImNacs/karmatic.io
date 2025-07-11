"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch, FiClock, FiMapPin, FiX } from 'react-icons/fi'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

interface SearchHistoryProps {
  className?: string
  refreshTrigger?: number
}

export function SearchHistory({ className, refreshTrigger }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchGroup[]>([])
  const [filteredHistory, setFilteredHistory] = useState<SearchGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    fetchSearchHistory()
  }, [refreshTrigger])
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHistory(history)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = history.map(group => ({
        ...group,
        searches: group.searches.filter(search => 
          search.location.toLowerCase().includes(query) ||
          (search.query && search.query.toLowerCase().includes(query))
        )
      })).filter(group => group.searches.length > 0)
      
      setFilteredHistory(filtered)
    }
  }, [searchQuery, history])
  
  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('/api/search/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.searches || [])
        setFilteredHistory(data.searches || [])
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearchClick = (searchId: string) => {
    router.push(`/explorer/${searchId}`)
  }
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours}h`
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }
  
  if (loading) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setTimeout(() => {
        document.getElementById('history-search-input')?.focus()
      }, 100)
    } else {
      setSearchQuery('')
    }
  }
  
  if (history.length === 0) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-center py-8 text-muted-foreground">
          <FiClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay búsquedas recientes</p>
        </div>
      </div>
    )
  }
  
  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Búsquedas recientes</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleSearchToggle}
            >
              {showSearch ? (
                <FiX className="h-4 w-4" />
              ) : (
                <FiSearch className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {showSearch && (
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="history-search-input"
                type="text"
                placeholder="Buscar en el historial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
        </div>
        
        {filteredHistory.length === 0 && searchQuery && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No se encontraron resultados para "{searchQuery}"</p>
          </div>
        )}
        
        {filteredHistory.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </h4>
            
            <div className="space-y-1">
              {group.searches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => handleSearchClick(search.id)}
                  onMouseEnter={() => setHoveredId(search.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200",
                    "hover:bg-accent/50 hover:scale-[1.02] active:scale-[0.98]",
                    "group relative overflow-hidden",
                    hoveredId === search.id && "bg-accent/30"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "mt-0.5 p-1.5 rounded-md transition-colors duration-200",
                      "bg-muted group-hover:bg-primary/10"
                    )}>
                      <FiMapPin className={cn(
                        "h-3.5 w-3.5 transition-colors duration-200",
                        "text-muted-foreground group-hover:text-primary"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {search.location}
                      </p>
                      {search.query && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {search.query}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatTime(search.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover effect gradient */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    "pointer-events-none"
                  )} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}