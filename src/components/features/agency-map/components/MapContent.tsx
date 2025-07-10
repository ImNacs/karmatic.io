'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useMap, InfoWindow, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps'
import { AnimatePresence } from 'framer-motion'
import { AgencyCardLocationMapEnhanced } from '@/components/features/agency-card'
import { AgencyComparison } from '@/components/features/agency-comparison'
import { MapMarkers } from './Markers/MapMarkers'
import { AgencyInfoWindow } from './Overlays/AgencyInfoWindow'
import { MapControlsOverlay } from './Controls/MapControlsOverlay'
import { MapZoomControls } from './Controls/MapZoomControls'
import { SelectedAgenciesPanel } from './Overlays/SelectedAgenciesPanel'
import { FloatingAnalysisButton } from './Overlays/FloatingAnalysisButton'
import type { Agency } from '@/types/agency'

/** Type alias for location coordinates */
type LocationCoords = { lat: number; lng: number }

/**
 * Props for the MapContent component
 * @interface MapContentProps
 */
interface MapContentProps {
  /** List of agencies to display on the map */
  agencies: Agency[]
  /** User's search location (optional) */
  searchLocation?: LocationCoords
  /** Currently selected agency IDs */
  selectedAgencies: string[]
  /** Callback when agency selection changes */
  onAgencySelect: (agencyId: string) => void
  /** Callback to start the analysis process */
  onStartAnalysis: () => void
  /** Loading state indicator */
  isLoading?: boolean
}

/**
 * MapContent - Core map logic and state management component
 * 
 * @description
 * This component manages all map interactions, state, and coordinates
 * the rendering of markers, overlays, and controls. It handles different
 * device types (mobile/desktop) with appropriate UX patterns.
 * 
 * @component
 * @example
 * ```tsx
 * <MapContent
 *   agencies={agencyList}
 *   searchLocation={userLocation}
 *   selectedAgencies={selectedIds}
 *   onAgencySelect={handleSelect}
 *   onStartAnalysis={handleAnalysis}
 * />
 * ```
 */
export const MapContent: React.FC<MapContentProps> = ({ 
  agencies, 
  searchLocation, 
  selectedAgencies, 
  onAgencySelect, 
  onStartAnalysis, 
  isLoading 
}) => {
  // Get map instance from context
  const map = useMap()
  
  // UI State Management
  /** Currently open info window agency ID */
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<string | null>(null)
  /** Show mobile card interface */
  const [showMobileCard, setShowMobileCard] = useState(false)
  /** Current agency index in mobile card view */
  const [mobileCardIndex, setMobileCardIndex] = useState(0)
  /** Device type detection */
  const [isMobile, setIsMobile] = useState(false)
  /** Comparison modal visibility */
  const [showComparison, setShowComparison] = useState(false)
  
  // API loading status for conditional rendering
  const apiLoadingStatus = useApiLoadingStatus()


  /**
   * Responsive design handler
   * Detects screen size changes and adjusts UI accordingly
   * Breakpoint: 768px (md in Tailwind)
   */
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkScreenSize()
    
    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  /**
   * Calculate map bounds to fit all agencies and search location
   * 
   * @memoized Recalculates when agencies or searchLocation change
   * @returns {google.maps.LatLngBounds} Bounds that include all points
   */
  const bounds = useMemo(() => {
    const bounds = new google.maps.LatLngBounds()
    
    // Include search location if provided
    if (searchLocation) {
      bounds.extend(searchLocation)
    }
    
    // Include all agency locations
    agencies.forEach(agency => {
      bounds.extend(agency.coordinates)
    })
    
    return bounds
  }, [agencies, searchLocation])

  /**
   * Auto-fit map to show all agencies
   * 
   * @effect
   * - Runs when map loads or agencies change
   * - Adds padding to ensure markers aren't at edges
   * - Prevents over-zooming (max zoom: 16)
   */
  useEffect(() => {
    if (map && agencies.length > 0 && apiLoadingStatus === APILoadingStatus.LOADED) {
      // Fit bounds with padding
      map.fitBounds(bounds, {
        top: 50,    // Space for controls
        right: 50,  // Standard padding
        bottom: 100, // Space for floating button
        left: 50    // Standard padding
      })
      
      // Prevent over-zoom for better context
      const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 16) {
          map.setZoom(16) // City district level max
        }
      })
      
      return () => {
        google.maps.event.removeListener(listener)
      }
    }
  }, [map, agencies, bounds, apiLoadingStatus])

  /**
   * Handle marker click with device-specific behavior
   * 
   * @param {string} agencyId - ID of clicked agency
   * 
   * Mobile: Opens swipeable card interface
   * Desktop: Shows info window and pans to marker
   */
  const handleMarkerClick = useCallback((agencyId: string) => {
    if (isMobile) {
      // Mobile: Show card interface
      const index = agencies.findIndex(a => a.id === agencyId)
      if (index !== -1) {
        setMobileCardIndex(index)
        setShowMobileCard(true)
      }
    } else {
      // Desktop: Show info window
      setSelectedInfoWindow(agencyId)
      
      // Smooth pan to center marker
      const agency = agencies.find(a => a.id === agencyId)
      if (agency && map) {
        map.panTo(agency.coordinates)
      }
    }
  }, [isMobile, agencies, map])

  /**
   * Handle agency selection/deselection
   * 
   * @param {string} agencyId - Agency to toggle
   * 
   * Closes info window when agency is deselected
   */
  const handleAgencySelect = useCallback((agencyId: string) => {
    onAgencySelect(agencyId)
    
    // Close info window if agency was deselected
    if (selectedAgencies.includes(agencyId)) {
      setSelectedInfoWindow(null)
    }
  }, [onAgencySelect, selectedAgencies])

  /**
   * Open Google Maps directions to agency
   * 
   * @param {Object} agency - Agency with coordinates
   * 
   * Opens in new tab with directions from search location to agency
   */
  const handleGetDirections = useCallback((agency: { coordinates?: LocationCoords; location?: LocationCoords }) => {
    // Format origin (user location)
    const origin = searchLocation ? `${searchLocation.lat},${searchLocation.lng}` : ''
    
    // Get agency coordinates (supports both property names)
    const coords = agency.coordinates || agency.location
    if (!coords) return
    
    // Format destination
    const destination = `${coords.lat},${coords.lng}`
    
    // Build Google Maps URL
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`
    window.open(url, '_blank')
  }, [searchLocation])

  /**
   * Navigate to specific agency in mobile card view
   * 
   * @param {number} index - Agency index in array
   * 
   * Updates card index and pans map to agency location
   */
  const handleMobileNavigate = useCallback((index: number) => {
    setMobileCardIndex(index)
    
    // Pan and zoom to selected agency
    if (map && agencies[index]) {
      map.panTo(agencies[index].coordinates)
      map.setZoom(16) // Closer zoom for mobile detail view
    }
  }, [agencies, map])

  /**
   * Loading state while Google Maps initializes
   */
  if (apiLoadingStatus !== APILoadingStatus.LOADED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <>
      <MapMarkers
        agencies={agencies}
        selectedAgencies={selectedAgencies}
        onMarkerClick={handleMarkerClick}
        searchLocation={searchLocation}
      />

      {/* Info windows */}
      {selectedInfoWindow && (() => {
        const agency = agencies.find(a => a.id === selectedInfoWindow)
        if (!agency) return null
        
        return (
          <InfoWindow
            position={agency.coordinates}
            onCloseClick={() => setSelectedInfoWindow(null)}
            pixelOffset={[0, -40]}
          >
            <AgencyInfoWindow
              agency={agency}
              isSelected={selectedAgencies.includes(agency.id)}
              onSelect={() => handleAgencySelect(agency.id)}
              onClose={() => setSelectedInfoWindow(null)}
            />
          </InfoWindow>
        )
      })()}

      {/* Map controls */}
      <MapControlsOverlay agencyCount={agencies.length} />
      
      {/* Zoom and center controls */}
      <MapZoomControls 
        agencies={agencies}
        searchLocation={searchLocation}
        isMobile={isMobile}
      />

      {/* Selected agencies panel */}
      <AnimatePresence>
        <SelectedAgenciesPanel
          agencies={agencies}
          selectedAgencies={selectedAgencies}
          onAgencyDeselect={onAgencySelect}
          onComparisonClick={() => setShowComparison(true)}
        />
      </AnimatePresence>

      {/* Floating action button */}
      <AnimatePresence>
        <FloatingAnalysisButton
          selectedCount={selectedAgencies.length}
          isLoading={isLoading || false}
          onStartAnalysis={onStartAnalysis}
        />
      </AnimatePresence>

      {/* Mobile card interface */}
      {showMobileCard && agencies.length > 0 && isMobile && (
        <AgencyCardLocationMapEnhanced
          agencies={agencies.map(agency => ({
            place_id: agency.placeId || agency.id,
            name: agency.name,
            address: agency.address,
            rating: agency.rating,
            user_ratings_total: agency.reviewCount,
            location: agency.coordinates,
            google_maps_url: `https://www.google.com/maps/place/?q=place_id:${agency.placeId || agency.id}`,
            website: agency.website,
            phone: agency.phone,
            opening_hours: agency.openingHours,
            reviews: agency.recentReviews?.map(review => ({
              author_name: review.author,
              rating: review.rating,
              relative_time_description: review.date,
              text: review.comment
            })),
            business_status: 'OPERATIONAL',
            vicinity: agency.address
          }))}
          currentAgencyIndex={mobileCardIndex}
          selectedAgencies={selectedAgencies}
          onAgencySelect={handleAgencySelect}
          onClose={() => setShowMobileCard(false)}
          onNavigate={handleMobileNavigate}
          onGetDirections={handleGetDirections}
        />
      )}

      {/* Comparison Modal */}
      <AgencyComparison
        agencies={agencies.filter(a => selectedAgencies.includes(a.id))}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onStartAnalysis={() => {
          setShowComparison(false)
          onStartAnalysis()
        }}
      />
    </>
  )
}