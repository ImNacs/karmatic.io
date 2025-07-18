/**
 * @fileoverview Home page with search interface
 * @module app/page
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchInterface } from "@/components/features/search"
import { LoadingScreen } from "@/components/common/loading-screen"
import { RegistrationModal } from "@/components/features/auth"
import { toast } from "sonner"
import type { SearchData } from "@/types/agency"
import { useSearchLimit } from "@/components/features/search/hooks/useSearchLimit"
import { trackEvent } from "@/lib/gtm/gtm"
import { useGooglePlaces } from "@/lib/google-places"
import { useSearchHistory } from "@/contexts/SearchHistoryContext"
import { transformAnalysisResponseToStoredFormat } from "@/mastra/services/data-transformer"

/**
 * Home page component with agency search functionality
 * @component
 * @returns {JSX.Element} Home page with search interface
 */
export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingSearchData, setPendingSearchData] = useState<SearchData | null>(null)
  
  const { canSearch, isAuthenticated } = useSearchLimit()
  const { getPlaceDetails } = useGooglePlaces()
  const { addOptimisticSearch, updateSearchId } = useSearchHistory()
  const router = useRouter()

  const handleSearch = async (data: SearchData) => {
    // Check if user can search (limit check)
    if (!canSearch && !isAuthenticated) {
      // Store the search data for after registration
      setPendingSearchData(data)
      setShowRegistrationModal(true)
      
      // Track that search was blocked
      trackEvent.searchBlocked(data.location, data.query)
      return
    }
    
    setIsLoading(true)
    
    try {
      // Get coordinates if needed
      let coordinates = data.coordinates
      
      if (!coordinates && data.placeId) {
        try {
          const placeDetails = await getPlaceDetails(data.placeId)
          if (placeDetails.geometry?.location) {
            coordinates = {
              lat: placeDetails.geometry.location.lat(),
              lng: placeDetails.geometry.location.lng()
            }
          }
        } catch (error) {
          console.error('Error getting place details:', error)
        }
      }
      
      // Add optimistic search immediately for instant UI update
      const tempId = addOptimisticSearch({
        location: data.location,
        query: data.query || null
      })
      
      // Execute search in background
      let searchResults
      
      try {
        // Realizar análisis con Core Trust Engine
        const analysisResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: data.query || null,
            location: {
              lat: coordinates?.lat || 0,
              lng: coordinates?.lng || 0,
              address: data.location
            }
          })
        })
        
        if (!analysisResponse.ok) {
          throw new Error('Error en análisis de confianza')
        }
        
        const analysisData = await analysisResponse.json()
        
        // Transformar respuesta a formato compatible con BD
        const storedFormat = transformAnalysisResponseToStoredFormat(
          analysisData,
          data.query || null,
          data.location
        )
        
        searchResults = {
          success: true,
          agencies: storedFormat.agencies,
          metadata: storedFormat.analysisMetadata
        }
        
      } catch (error) {
        console.error('Error en análisis:', error)
        
        // Fallback a búsqueda básica si falla el análisis
        searchResults = {
          success: false,
          agencies: [],
          error: 'Error en análisis de confianza'
        }
      }
      
      // Save search to database
      const response = await fetch('/api/search/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: data.location,
          query: data.query,
          placeId: data.placeId,
          coordinates,
          results: {
            agencies: searchResults.agencies || [],
            metadata: searchResults.metadata
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Save search error:', errorData)
        throw new Error(errorData.error || 'Error al guardar la búsqueda')
      }
      
      const { searchId } = await response.json()
      
      // Update the temporary ID with the real ID
      updateSearchId(tempId, searchId)
      
      // Navigate to explorer with real ID
      router.push(`/explorer/${searchId}`)
      
    } catch (error) {
      console.error('Error processing search:', error)
      
      // Mostrar error específico según el tipo
      if (error instanceof Error) {
        if (error.message.includes('análisis')) {
          toast.error('Error en análisis de confianza. Intenta más tarde.')
        } else if (error.message.includes('guardar')) {
          toast.error('Error al guardar la búsqueda. Intenta de nuevo.')
        } else {
          toast.error('Error al procesar la búsqueda')
        }
      } else {
        toast.error('Error inesperado al procesar la búsqueda')
      }
      
      setIsLoading(false)
      // No navegar automáticamente en error, dejar que usuario reinicie
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[60vh]">
        <SearchInterface 
          onSearch={handleSearch} 
          isLoading={isLoading}
        />
      </div>

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false)
          setPendingSearchData(null)
        }}
        searchData={pendingSearchData ? {
          location: pendingSearchData.location,
          query: pendingSearchData.query
        } : undefined}
        trigger="search_limit"
      />

      {isLoading && (
        <LoadingScreen
          type="analysis"
          title="Analizando agencias..."
          subtitle="Realizando análisis de confianza y reputación (2-3 minutos)"
        />
      )}
    </div>
  )
}