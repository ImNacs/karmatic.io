"use client"

import React, { useState, useEffect, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch, FiClock, FiMapPin, FiX, FiTrash2 } from 'react-icons/fi'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSearchHistory } from '@/contexts/SearchHistoryContext'
import { motion, AnimatePresence } from 'motion/react'

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
}

function SearchHistoryComponent({ className }: SearchHistoryProps) {
  const { history, isLoading, deleteSearch } = useSearchHistory()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  
  // Memoize filtered history to prevent unnecessary recalculations
  const filteredHistory = useMemo(() => {
    if (searchQuery.trim() === '') {
      return history
    }
    
    const query = searchQuery.toLowerCase()
    return history.map(group => ({
      ...group,
      searches: group.searches.filter(search => 
        search.location.toLowerCase().includes(query) ||
        (search.query && search.query.toLowerCase().includes(query))
      )
    })).filter(group => group.searches.length > 0)
  }, [searchQuery, history])
  
  const handleSearchClick = (searchId: string) => {
    if (deletingId === searchId) return // Prevent navigation while deleting
    router.push(`/explorer/${searchId}`)
  }
  
  const handleDeleteClick = async (e: React.MouseEvent, searchId: string) => {
    e.stopPropagation() // Prevent navigation
    setDeletingId(searchId)
    await deleteSearch(searchId)
    setDeletingId(null)
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
  
  // Only show loading on initial load, not on updates
  if (isLoading && history.length === 0) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <div className="h-11 w-full bg-muted animate-pulse rounded-lg" />
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
  
  // Check if there are any searches in any group
  const hasSearches = history.some(group => group.searches && group.searches.length > 0)
  
  if (!hasSearches) {
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
      <motion.div 
        className="p-4 space-y-4"
        initial={false}
        animate={{ opacity: 1 }}
      >
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
        
        <AnimatePresence mode="popLayout">
          {filteredHistory.length === 0 && searchQuery && (
            <motion.div 
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="text-center py-6 text-muted-foreground"
            >
              <p className="text-sm">No se encontraron resultados para "{searchQuery}"</p>
            </motion.div>
          )}
          
          {filteredHistory.map((group, groupIndex) => (
            <motion.div 
              key={`${group.label}-${groupIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.2,
                delay: groupIndex * 0.05
              }}
              className="space-y-2"
            >
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h4>
              
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {group.searches.map((search, searchIndex) => (
                    <motion.div
                      key={search.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.8 }}
                      transition={{ 
                        duration: 0.2,
                        delay: searchIndex * 0.03
                      }}
                      onMouseEnter={() => setHoveredId(search.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-200",
                        "hover:bg-accent/50",
                        "group relative cursor-pointer",
                        hoveredId === search.id && "bg-accent/30"
                      )}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className="flex flex-col items-center space-y-1">
                          <div 
                            className={cn(
                              "p-1.5 rounded-md transition-colors duration-200",
                              "bg-muted group-hover:bg-primary/10"
                            )}
                            onClick={() => handleSearchClick(search.id)}
                          >
                            <FiMapPin className={cn(
                              "h-3.5 w-3.5 transition-colors duration-200",
                              "text-muted-foreground group-hover:text-primary"
                            )} />
                          </div>
                          
                          {/* Delete button below location icon */}
                          <button
                            onClick={(e) => handleDeleteClick(e, search.id)}
                            className={cn(
                              "p-1 rounded-md transition-all duration-200",
                              "hover:bg-red-100 dark:hover:bg-red-900/20",
                              "text-muted-foreground hover:text-red-600 dark:hover:text-red-400",
                              deletingId === search.id && "opacity-50 cursor-not-allowed",
                              "opacity-0 group-hover:opacity-100"
                            )}
                            disabled={deletingId === search.id}
                          >
                            <FiTrash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => handleSearchClick(search.id)}
                        >
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
                      <motion.div 
                        className={cn(
                          "absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent",
                          "pointer-events-none"
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: hoveredId === search.id ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </ScrollArea>
  )
}

// Export memoized component to prevent unnecessary re-renders
export const SearchHistory = memo(SearchHistoryComponent)