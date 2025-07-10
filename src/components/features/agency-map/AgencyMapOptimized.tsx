'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { APIProvider, Map } from '@vis.gl/react-google-maps'
import { MapContent } from './components/MapContent'
import { useThemeDetection } from '@/hooks/use-theme-detection'
import { cn } from '@/lib/utils'
import type { Agency } from '@/types/agency'

/**
 * Props for the AgencyMapOptimized component
 * @interface AgencyMapOptimizedProps
 */
interface AgencyMapOptimizedProps {
  /** Array of agencies to display on the map */
  agencies: Agency[]
  
  /** User's search location coordinates (optional) */
  searchLocation?: { lat: number; lng: number }
  
  /** Array of currently selected agency IDs */
  selectedAgencies: string[]
  
  /** Callback fired when an agency is selected/deselected */
  onAgencySelect: (agencyId: string) => void
  
  /** Callback to initiate the analysis process */
  onStartAnalysis: () => void
  
  /** Loading state for UI feedback */
  isLoading?: boolean
}





/**
 * AgencyMapOptimized - High-performance map component for displaying automotive agencies
 * 
 * @description
 * This component serves as the main map interface for visualizing and interacting with
 * automotive agencies. It uses Google Maps through the @vis.gl/react-google-maps library
 * for optimal performance and modern React patterns.
 * 
 * @example
 * ```tsx
 * <AgencyMapOptimized
 *   agencies={agencyList}
 *   searchLocation={{ lat: 19.4326, lng: -99.1332 }}
 *   selectedAgencies={['agency-1', 'agency-2']}
 *   onAgencySelect={(id) => console.log('Selected:', id)}
 *   onStartAnalysis={() => console.log('Starting analysis')}
 *   isLoading={false}
 * />
 * ```
 * 
 * @param {AgencyMapOptimizedProps} props - Component props
 * @returns {JSX.Element} Rendered map component
 * 
 * @since 1.0.0
 * @see {@link MapContent} for internal map logic
 * @see {@link https://visgl.github.io/react-google-maps/} for library documentation
 */
export function AgencyMapOptimized({
  agencies,
  searchLocation,
  selectedAgencies,
  onAgencySelect,
  onStartAnalysis,
  isLoading = false
}: AgencyMapOptimizedProps) {
  // Get current theme
  const { isDarkMode, mounted } = useThemeDetection()
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Add smooth transition effect when theme changes
  useEffect(() => {
    if (mounted) {
      setIsTransitioning(true)
      const timer = setTimeout(() => setIsTransitioning(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isDarkMode, mounted])
  
  /**
   * Calculate the center point of the map
   * Priority: searchLocation > average of agencies > default CDMX
   * 
   * @memoized Recalculates only when agencies or searchLocation change
   */
  const center = useMemo(() => {
    // 1. Use search location if provided
    return searchLocation || (
      agencies.length > 0 
        ? {
            // 2. Calculate centroid of all agencies
            lat: agencies.reduce((sum, a) => sum + a.coordinates.lat, 0) / agencies.length,
            lng: agencies.reduce((sum, a) => sum + a.coordinates.lng, 0) / agencies.length
          }
        : { lat: 19.4326, lng: -99.1332 } // 3. Default to Mexico City center
    )
  }, [agencies, searchLocation])
  

  return (
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      // Use beta version for dark mode support
      version="beta"
      // Libraries are loaded automatically by @vis.gl/react-google-maps
    >
      <div className="relative w-full h-full">
        {/* Show loading state while theme is being detected */}
        {!mounted && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}
        
        {/* Theme transition overlay */}
        <div className={cn(
          "map-theme-overlay",
          isTransitioning && "transitioning"
        )} />
        
        <Map
          // Map ID is required for advanced markers
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
          
          // Use beta colorScheme API for dark mode support
          colorScheme={mounted ? (isDarkMode ? "DARK" : "LIGHT") : "LIGHT"}
          
          // Initial map position and zoom
          defaultCenter={center}
          defaultZoom={14} // City-level zoom
          
          // Performance optimizations
          reuseMaps={true} // Reuse map instances when remounting
          
          // UX configurations
          gestureHandling="greedy" // No ctrl needed for zoom
          disableDefaultUI={true} // We provide custom controls
          keyboardShortcuts={false} // Prevent conflicts with app shortcuts
          clickableIcons={false} // Disable POI clicks
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={false}
        >
          {/* MapContent handles all map interactions and state */}
          <MapContent
            agencies={agencies}
            searchLocation={searchLocation}
            selectedAgencies={selectedAgencies}
            onAgencySelect={onAgencySelect}
            onStartAnalysis={onStartAnalysis}
            isLoading={isLoading}
          />
        </Map>
      </div>
    </APIProvider>
  )
}