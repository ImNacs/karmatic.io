"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import type { SearchData } from "@/types/agency"
import { SearchForm } from "./components/SearchForm"
import { SearchLimitIndicator } from "./components/SearchLimitIndicator"
import { useSearchLimit } from "./hooks/useSearchLimit"
import { SEARCH_TEXT, ANIMATION_CONFIG } from "./utils/constants"

interface SearchInterfaceProps {
  onSearch: (data: SearchData) => void
  isLoading?: boolean
}

/**
 * SearchInterface - Main search component
 * 
 * @component
 * @description
 * The primary search interface that orchestrates all search-related
 * functionality including form, limit indicator, and animations.
 * 
 * Architecture:
 * - Uses feature-based structure with all related components co-located
 * - Delegates form logic to SearchForm component
 * - Integrates search limits via custom hook
 * - Provides smooth animations and responsive design
 * 
 * @example
 * ```tsx
 * <SearchInterface 
 *   onSearch={handleSearch}
 *   isLoading={searchInProgress}
 * />
 * ```
 */
export function SearchInterface({ onSearch, isLoading = false }: SearchInterfaceProps) {
  const { remaining, total, isAuthenticated, canSearch, loading: limitLoading } = useSearchLimit()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_CONFIG.fadeIn / 1000 }}
      className="w-full max-w-2xl mx-auto p-4"
    >
      <Card className="shadow-lg">
        <CardHeader className="text-center relative">
          <CardTitle className="text-2xl font-bold">
            {SEARCH_TEXT.title}
          </CardTitle>
          <CardDescription>
            {SEARCH_TEXT.description}
          </CardDescription>
          
          {/* Search limit indicator for unauthenticated users */}
          {!isAuthenticated && !limitLoading && (
            <div className="flex justify-center mt-4">
              <SearchLimitIndicator 
                remaining={remaining} 
                total={total} 
              />
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <SearchForm
            onSearch={onSearch}
            isLoading={isLoading}
            canSearch={canSearch}
            isAuthenticated={isAuthenticated}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}