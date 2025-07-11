'use client'

import React from 'react'
import { motion } from 'motion/react'
import { useMap } from '@vis.gl/react-google-maps'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FiPlus, FiMinus, FiMaximize2, FiTarget } from 'react-icons/fi'
import { cn } from '@/lib/utils'

interface MapZoomControlsProps {
  agencies: Array<{ coordinates: { lat: number; lng: number } }>
  searchLocation?: { lat: number; lng: number }
  className?: string
  isMobile?: boolean
}

export const MapZoomControls: React.FC<MapZoomControlsProps> = ({
  agencies,
  searchLocation,
  className,
  isMobile = false
}) => {
  const map = useMap()

  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || 14
      map.setZoom(Math.min(currentZoom + 1, 20))
    }
  }

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 14
      map.setZoom(Math.max(currentZoom - 1, 1))
    }
  }

  const handleFitToView = () => {
    if (map && agencies.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      
      // Include search location if provided
      if (searchLocation) {
        bounds.extend(searchLocation)
      }
      
      // Include all agency locations
      agencies.forEach(agency => {
        bounds.extend(agency.coordinates)
      })
      
      // Fit bounds with padding
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 100,
        left: 50
      })
    }
  }

  const handleRecenter = () => {
    if (map) {
      if (searchLocation) {
        // Center on search location if available
        map.panTo(searchLocation)
        map.setZoom(14)
      } else if (agencies.length > 0) {
        // Center on agencies centroid
        const centerLat = agencies.reduce((sum, a) => sum + a.coordinates.lat, 0) / agencies.length
        const centerLng = agencies.reduce((sum, a) => sum + a.coordinates.lng, 0) / agencies.length
        map.panTo({ lat: centerLat, lng: centerLng })
        map.setZoom(14)
      } else {
        // Default to Mexico City
        map.panTo({ lat: 19.4326, lng: -99.1332 })
        map.setZoom(11)
      }
    }
  }

  if (!map) return null

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className={cn(
        "absolute flex gap-2 pointer-events-auto",
        isMobile 
          ? "bottom-4 right-4 flex-row" 
          : "bottom-20 right-4 flex-col",
        className
      )}
    >
      <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-1">
        <div className={cn(
          "flex gap-1",
          isMobile ? "flex-row" : "flex-col"
        )}>
          {/* Zoom In */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-10 w-10 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            title="Acercar"
          >
            <FiPlus className="h-4 w-4" />
          </Button>
          
          {/* Zoom Out */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-10 w-10 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            title="Alejar"
          >
            <FiMinus className="h-4 w-4" />
          </Button>
          
          {/* Divider */}
          <div className={cn(
            "bg-border",
            isMobile ? "w-px h-6 mx-1 my-2" : "h-px mx-2 my-1"
          )} />
          
          {/* Fit to View */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitToView}
            className="h-10 w-10 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            title="Ver todas las agencias"
          >
            <FiMaximize2 className="h-4 w-4" />
          </Button>
          
          {/* Recenter */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRecenter}
            className="h-10 w-10 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            title="Centrar mapa"
          >
            <FiTarget className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}