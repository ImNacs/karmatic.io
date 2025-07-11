"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VerticalSidebar } from "@/components/features/sidebar"
import { SearchInterface } from "@/components/features/search"
import { LoadingScreen } from "@/components/common/loading-screen"
import { RegistrationModal } from "@/components/features/auth"
import { toast } from "sonner"
import type { SearchData } from "@/types/agency"
import { useSearchLimit } from "@/components/features/search/hooks/useSearchLimit"
import { trackEvent } from "@/lib/gtm/gtm"
import { n8nApi } from "@/lib/n8n-api"
import { useGooglePlaces } from "@/lib/google-places"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingSearchData, setPendingSearchData] = useState<SearchData | null>(null)
  
  const { canSearch, isAuthenticated } = useSearchLimit()
  const { getPlaceDetails } = useGooglePlaces()
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
      
      // Execute search
      let searchResults
      
      if (!n8nApi.isConfigured()) {
        // Use mock data for demo
        await new Promise(resolve => setTimeout(resolve, 2000))
        searchResults = {
          success: true,
          agencies: [] // Will use mock data in explorer
        }
      } else {
        searchResults = await n8nApi.searchAgencies({
          location: data.location,
          query: data.query || '',
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          placeId: data.placeId,
          placeDetails: data.placeDetails,
        })
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
      
      // Navigate to explorer with search ID
      router.push(`/explorer/${searchId}`)
      
    } catch (error) {
      console.error('Error processing search:', error)
      toast.error('Error al procesar la búsqueda')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <VerticalSidebar userTokens={150} />
      
      <main className="lg:ml-64 container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <SearchInterface 
            onSearch={handleSearch} 
            isLoading={isLoading}
          />
        </div>
      </main>

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