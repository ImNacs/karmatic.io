"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { GoogleMap, InfoWindow, OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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
import { AgencyDetailDesktop } from './agency-detail-desktop'
import { AgencyComparison } from './agency-comparison'
import { AgencyMapDesktop } from './agency-map-desktop'

type LocationCoords = { lat: number; lng: number }

interface AgencyMapEnhancedProps {
  agencies: Agency[]
  searchLocation?: { lat: number; lng: number }
  selectedAgencies: string[]
  onAgencySelect: (agencyId: string) => void
  onStartAnalysis: () => void
  isLoading?: boolean
}

// Modern map styles with dark mode support
const mapStyles = {
  light: [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
  ],
  dark: [
    { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8c8c8c" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
  ]
}

// Custom marker component with selection state
const CustomMarker: React.FC<{
  agency: Agency
  isSelected: boolean
  onClick: () => void
}> = ({ isSelected, onClick }) => {
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full cursor-pointer shadow-lg transition-all duration-200",
          isSelected 
            ? "bg-primary text-primary-foreground ring-4 ring-primary/30" 
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-xl"
        )}
        onClick={onClick}
      >
        <FiMapPin className="w-5 h-5" />
      </motion.div>
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
    </div>
  )
}

// Enhanced info window with glassmorphism effect
const AgencyInfoWindow: React.FC<{
  agency: Agency
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
}> = ({ agency, isSelected, onSelect, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="relative"
    >
      <Card className="w-80 overflow-hidden shadow-2xl border-0 backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
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
    </motion.div>
  )
}

// Floating selected agencies panel
const SelectedAgenciesPanel: React.FC<{
  agencies: Agency[]
  selectedIds: string[]
  onRemove: (id: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
  onCompare?: () => void
}> = ({ agencies, selectedIds, onRemove, isExpanded, onToggleExpand, onCompare }) => {
  const selectedAgencies = agencies.filter(a => selectedIds.includes(a.id))

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-20"
    >
      <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-2xl border-0">
        <div className="p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {selectedIds.length} agencias seleccionadas
              </Badge>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronUp className="w-5 h-5" />
            </motion.div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {selectedAgencies.map((agency) => (
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
                      onClick={() => onRemove(agency.id)}
                    >
                      <FiX className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Compare button - only show when 2+ agencies selected */}
          {isExpanded && selectedIds.length >= 2 && onCompare && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onCompare}
              >
                <FiTrendingUp className="w-4 h-4 mr-2" />
                Comparar agencias
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// Main enhanced map component
export function AgencyMapEnhanced({
  agencies,
  searchLocation,
  selectedAgencies,
  onAgencySelect,
  onStartAnalysis,
  isLoading = false
}: AgencyMapEnhancedProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<string | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showMobileCard, setShowMobileCard] = useState(false)
  const [mobileCardIndex, setMobileCardIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  
  // Check for dark mode and screen size
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsDesktop(width >= 1024)
    }
    
    checkDarkMode()
    checkScreenSize()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    // Listen for resize
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // Calculate map center and bounds
  const center = useMemo(() => {
    if (searchLocation) return searchLocation
    if (agencies.length === 0) return { lat: 19.4326, lng: -99.1332 } // Default to CDMX
    
    const avgLat = agencies.reduce((sum, a) => sum + a.coordinates.lat, 0) / agencies.length
    const avgLng = agencies.reduce((sum, a) => sum + a.coordinates.lng, 0) / agencies.length
    
    return { lat: avgLat, lng: avgLng }
  }, [agencies, searchLocation])

  // Fit bounds to show all markers
  useEffect(() => {
    if (map && agencies.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      
      if (searchLocation) {
        bounds.extend(searchLocation)
      }
      
      agencies.forEach(agency => {
        bounds.extend(agency.coordinates)
      })
      
      map.fitBounds(bounds)
      const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 16) {
          map.setZoom(16)
        }
      })
      
      return () => google.maps.event.removeListener(listener)
    }
  }, [map, agencies, searchLocation])

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMarkerClick = (agencyId: string) => {
    if (isMobile) {
      // On mobile, show the card interface
      const index = agencies.findIndex(a => a.id === agencyId)
      if (index !== -1) {
        setMobileCardIndex(index)
        setShowMobileCard(true)
      }
    } else {
      // On desktop, show the info window
      setSelectedInfoWindow(agencyId)
    }
  }

  const handleAgencySelect = (agencyId: string) => {
    onAgencySelect(agencyId)
    if (selectedAgencies.includes(agencyId)) {
      setSelectedInfoWindow(null)
    }
  }

  const handleGetDirections = (agency: { coordinates?: LocationCoords; location?: LocationCoords }) => {
    // Open Google Maps directions
    const origin = searchLocation ? `${searchLocation.lat},${searchLocation.lng}` : ''
    const coords = agency.coordinates || agency.location
    if (!coords) return
    const destination = `${coords.lat},${coords.lng}`
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`
    window.open(url, '_blank')
  }

  const handleMobileNavigate = (index: number) => {
    setMobileCardIndex(index)
    // Center map on the agency
    if (map && agencies[index]) {
      map.panTo(agencies[index].coordinates)
      map.setZoom(16)
    }
  }

  const mapOptions: google.maps.MapOptions = {
    styles: isDarkMode ? mapStyles.dark : mapStyles.light,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
    gestureHandling: 'greedy',
    clickableIcons: false,
  }

  // Use desktop-optimized component for larger screens
  if (isDesktop) {
    return (
      <AgencyMapDesktop
        agencies={agencies}
        searchLocation={searchLocation}
        selectedAgencies={selectedAgencies}
        onAgencySelect={onAgencySelect}
        onStartAnalysis={onStartAnalysis}
        isLoading={isLoading}
      />
    )
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* User location marker */}
        {searchLocation && (
          <OverlayView
            position={searchLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
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
          </OverlayView>
        )}

        {/* Agency markers */}
        {agencies.map((agency) => (
          <React.Fragment key={agency.id}>
            <OverlayView
              position={agency.coordinates}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <CustomMarker
                agency={agency}
                isSelected={selectedAgencies.includes(agency.id)}
                onClick={() => handleMarkerClick(agency.id)}
              />
            </OverlayView>

            {/* Info window */}
            {selectedInfoWindow === agency.id && (
              <InfoWindow
                position={agency.coordinates}
                onCloseClick={() => setSelectedInfoWindow(null)}
                options={{
                  pixelOffset: new google.maps.Size(0, -40),
                  disableAutoPan: false,
                  maxWidth: 320,
                }}
              >
                <AgencyInfoWindow
                  agency={agency}
                  isSelected={selectedAgencies.includes(agency.id)}
                  onSelect={() => handleAgencySelect(agency.id)}
                  onClose={() => setSelectedInfoWindow(null)}
                />
              </InfoWindow>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>

      {/* Selected agencies panel */}
      {selectedAgencies.length > 0 && (
        <SelectedAgenciesPanel
          agencies={agencies}
          selectedIds={selectedAgencies}
          onRemove={onAgencySelect}
          isExpanded={isPanelExpanded}
          onToggleExpand={() => setIsPanelExpanded(!isPanelExpanded)}
          onCompare={() => setShowComparison(true)}
        />
      )}

      {/* Floating action button for analysis */}
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

      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-3">
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{agencies.length} agencias encontradas</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Navigation help */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiNavigation className="w-4 h-4" />
              <span>Click en los marcadores para más info</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Card interface - Mobile/Tablet uses enhanced card, Desktop uses detail view */}
      {showMobileCard && agencies.length > 0 && (
        isMobile ? (
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
        ) : (
          <AgencyDetailDesktop
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
            onCompareAgencies={() => {
              setShowMobileCard(false)
              setShowComparison(true)
            }}
          />
        )
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
    </div>
  )
}