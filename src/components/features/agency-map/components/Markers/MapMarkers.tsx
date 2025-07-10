'use client'

import React, { useEffect, useRef } from 'react'
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { motion } from 'framer-motion'
import { AgencyMarker } from './AgencyMarker'
import type { Agency } from '@/types/agency'

type LocationCoords = { lat: number; lng: number }

interface MapMarkersProps {
  agencies: Agency[]
  selectedAgencies: string[]
  onMarkerClick: (agencyId: string) => void
  searchLocation?: LocationCoords
}

export const MapMarkers: React.FC<MapMarkersProps> = ({ 
  agencies, 
  selectedAgencies, 
  onMarkerClick, 
  searchLocation 
}) => {
  const map = useMap()
  const clustererRef = useRef<MarkerClusterer | null>(null)

  // Initialize clustering
  useEffect(() => {
    if (!map) return

    // Note: Clustering with @vis.gl/react-google-maps requires a different approach
    // For now, we'll render individual markers without clustering
    // Clustering can be added later with a custom implementation

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers()
        clustererRef.current = null
      }
    }
  }, [map])

  return (
    <>
      {/* User location marker */}
      {searchLocation && (
        <AdvancedMarker position={searchLocation}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
            <div className="relative w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs font-medium bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-full shadow-md">
                Tu ubicación
              </span>
            </div>
          </motion.div>
        </AdvancedMarker>
      )}

      {/* Agency markers */}
      {agencies.map((agency) => (
        <AgencyMarker
          key={agency.id}
          agency={agency}
          isSelected={selectedAgencies.includes(agency.id)}
          onClick={() => onMarkerClick(agency.id)}
        />
      ))}
    </>
  )
}