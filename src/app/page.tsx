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
      
      // TODO: Implement search with Mastra
      await new Promise(resolve => setTimeout(resolve, 2000))
      searchResults = {
        success: true,
        agencies: [] // Will use mock data in explorer
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
          results: searchResults.agencies || []
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
      toast.error('Error al procesar la búsqueda')
      setIsLoading(false)
      // Navigate back to home on error
      router.push('/')
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
          type="search"
          title="Buscando agencias..."
          subtitle="Estamos buscando las mejores agencias cerca de ti"
        />
      )}
    </div>
  )
}