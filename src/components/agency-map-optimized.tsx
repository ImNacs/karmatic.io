"use client"

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap, InfoWindow, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  FiStar, 
  FiMapPin, 
  FiPhone, 
  FiGlobe, 
  FiClock,
  FiCheck,
  FiChevronUp,
  FiNavigation,
  FiFilter,
  FiX,
  FiTrendingUp
} from 'react-icons/fi'
import type { Agency } from '@/types/agency'
import { AgencyCardLocationMapEnhanced } from './agency-card-location-map-enhanced'
import { AgencyComparison } from './agency-comparison'

type LocationCoords = { lat: number; lng: number }

interface AgencyMapOptimizedProps {
  agencies: Agency[]
  searchLocation?: { lat: number; lng: number }
  selectedAgencies: string[]
  onAgencySelect: (agencyId: string) => void
  onStartAnalysis: () => void
  isLoading?: boolean
}

// Custom marker component using AdvancedMarker
const AgencyMarker: React.FC<{
  agency: Agency
  isSelected: boolean
  onClick: () => void
}> = ({ agency, isSelected, onClick }) => {
  return (
    <AdvancedMarker 
      position={agency.coordinates}
      onClick={onClick}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer shadow-lg transition-all duration-200
          ${isSelected 
            ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' 
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-xl'}
        `}
      >
        <FiMapPin className="w-5 h-5" />
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AdvancedMarker>
  )
}

// Map markers component with clustering support
const MapMarkers: React.FC<{
  agencies: Agency[]
  selectedAgencies: string[]
  onMarkerClick: (agencyId: string) => void
  searchLocation?: LocationCoords
}> = ({ agencies, selectedAgencies, onMarkerClick, searchLocation }) => {
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

// Enhanced info window component
const AgencyInfoWindow: React.FC<{
  agency: Agency
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
}> = ({ agency, isSelected, onSelect, onClose }) => {
  return (
    <Card className="w-80 overflow-hidden shadow-2xl border-0 backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
      <div className="relative p-4">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 w-8 h-8 p-0"
          onClick={onClose}
        >
          <FiX className="w-4 h-4" />
        </Button>
        
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg pr-8">{agency.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="ml-1 text-sm font-medium">{agency.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{agency.distance}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <FiMapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{agency.address}</span>
            </div>
            
            {agency.phone && (
              <div className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${agency.phone}`} className="text-primary hover:underline">
                  {agency.phone}
                </a>
              </div>
            )}
            
            {agency.website && (
              <div className="flex items-center gap-2">
                <FiGlobe className="w-4 h-4 text-muted-foreground" />
                <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {agency.website}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <FiClock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{agency.hours}</span>
            </div>
          </div>

          <Button
            className="w-full"
            variant={isSelected ? "secondary" : "default"}
            onClick={onSelect}
          >
            {isSelected ? (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                Seleccionada
              </>
            ) : (
              'Seleccionar para análisis'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Map content component
const MapContent: React.FC<{
  agencies: Agency[]
  searchLocation?: LocationCoords
  selectedAgencies: string[]
  onAgencySelect: (agencyId: string) => void
  onStartAnalysis: () => void
  isLoading?: boolean
}> = ({ agencies, searchLocation, selectedAgencies, onAgencySelect, onStartAnalysis, isLoading }) => {
  const map = useMap()
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<string | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)
  const [showMobileCard, setShowMobileCard] = useState(false)
  const [mobileCardIndex, setMobileCardIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const apiLoadingStatus = useApiLoadingStatus()

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // Calculate map bounds
  const bounds = useMemo(() => {
    const bounds = new google.maps.LatLngBounds()
    
    if (searchLocation) {
      bounds.extend(searchLocation)
    }
    
    agencies.forEach(agency => {
      bounds.extend(agency.coordinates)
    })
    
    return bounds
  }, [agencies, searchLocation])

  // Fit bounds when map is loaded and agencies change
  useEffect(() => {
    if (map && agencies.length > 0 && apiLoadingStatus === APILoadingStatus.LOADED) {
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 100,
        left: 50
      })
      
      // Prevent over-zoom
      const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 16) {
          map.setZoom(16)
        }
      })
      
      return () => {
        google.maps.event.removeListener(listener)
      }
    }
  }, [map, agencies, bounds, apiLoadingStatus])

  const handleMarkerClick = useCallback((agencyId: string) => {
    if (isMobile) {
      const index = agencies.findIndex(a => a.id === agencyId)
      if (index !== -1) {
        setMobileCardIndex(index)
        setShowMobileCard(true)
      }
    } else {
      setSelectedInfoWindow(agencyId)
      
      // Smooth pan to marker
      const agency = agencies.find(a => a.id === agencyId)
      if (agency && map) {
        map.panTo(agency.coordinates)
      }
    }
  }, [isMobile, agencies, map])

  const handleAgencySelect = useCallback((agencyId: string) => {
    onAgencySelect(agencyId)
    if (selectedAgencies.includes(agencyId)) {
      setSelectedInfoWindow(null)
    }
  }, [onAgencySelect, selectedAgencies])

  const handleGetDirections = useCallback((agency: { coordinates?: LocationCoords; location?: LocationCoords }) => {
    const origin = searchLocation ? `${searchLocation.lat},${searchLocation.lng}` : ''
    const coords = agency.coordinates || agency.location
    if (!coords) return
    const destination = `${coords.lat},${coords.lng}`
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`
    window.open(url, '_blank')
  }, [searchLocation])

  const handleMobileNavigate = useCallback((index: number) => {
    setMobileCardIndex(index)
    if (map && agencies[index]) {
      map.panTo(agencies[index].coordinates)
      map.setZoom(16)
    }
  }, [agencies, map])

  if (apiLoadingStatus !== APILoadingStatus.LOADED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex justify-between items-start">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pointer-events-auto"
          >
            <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-3">
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{agencies.length} agencias encontradas</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pointer-events-auto"
          >
            <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FiNavigation className="w-4 h-4" />
                <span>Click en los marcadores para más info</span>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Selected agencies panel */}
      <AnimatePresence>
        {selectedAgencies.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-20 pointer-events-auto"
          >
            <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-2xl border-0">
              <div className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {selectedAgencies.length} agencias seleccionadas
                    </Badge>
                  </div>
                  <motion.div
                    animate={{ rotate: isPanelExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronUp className="w-5 h-5" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {isPanelExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-2 overflow-hidden"
                    >
                      {agencies.filter(a => selectedAgencies.includes(a.id)).map((agency) => (
                        <motion.div
                          key={agency.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{agency.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <FiStar className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs">{agency.rating}</span>
                              <span className="text-xs text-muted-foreground">• {agency.distance}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => onAgencySelect(agency.id)}
                          >
                            <FiX className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                      
                      {selectedAgencies.length >= 2 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setShowComparison(true)}
                          >
                            <FiTrendingUp className="w-4 h-4 mr-2" />
                            Comparar agencias
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <AnimatePresence>
        {selectedAgencies.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30"
          >
            <Button
              size="lg"
              className="shadow-2xl px-8 py-6 text-base font-semibold group"
              onClick={onStartAnalysis}
              disabled={isLoading || selectedAgencies.length === 0}
            >
              <FiTrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Analizar {selectedAgencies.length} {selectedAgencies.length === 1 ? 'agencia' : 'agencias'}
            </Button>
          </motion.div>
        )}
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

// Main optimized map component
export function AgencyMapOptimized({
  agencies,
  searchLocation,
  selectedAgencies,
  onAgencySelect,
  onStartAnalysis,
  isLoading = false
}: AgencyMapOptimizedProps) {
  const center = useMemo(() => {
    return searchLocation || (
      agencies.length > 0 
        ? {
            lat: agencies.reduce((sum, a) => sum + a.coordinates.lat, 0) / agencies.length,
            lng: agencies.reduce((sum, a) => sum + a.coordinates.lng, 0) / agencies.length
          }
        : { lat: 19.4326, lng: -99.1332 } // Default to CDMX
    )
  }, [agencies, searchLocation])

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative w-full h-full">
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
          defaultCenter={center}
          defaultZoom={14}
          reuseMaps={true}
          gestureHandling="greedy"
          disableDefaultUI={true}
          keyboardShortcuts={false}
          clickableIcons={false}
        >
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