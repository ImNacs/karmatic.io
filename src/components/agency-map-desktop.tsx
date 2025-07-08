"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { GoogleMap, OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  FiStar,
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiClock,
  FiCheck,
  FiX,
  FiChevronUp,
  FiNavigation,
  FiFilter,
  FiSearch,
  FiTrendingUp,
  FiGrid,
  FiMap,
  FiMaximize2,
  FiBookmark,
  FiShare2,
  FiMessageSquare,
  FiDollarSign,
  FiBarChart2
} from 'react-icons/fi'
import type { Agency } from '@/types/agency'
import { AgencyComparison } from './agency-comparison'

interface AgencyMapDesktopProps {
  agencies: Agency[]
  searchLocation?: { lat: number; lng: number }
  selectedAgencies: string[]
  onAgencySelect: (agencyId: string) => void
  onStartAnalysis: () => void
  isLoading?: boolean
}

// Light theme map styles - Airbnb-inspired with automotive focus
const lightMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f7f7f7" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#484848" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f0f0f0" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5f4e3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0f0f0" }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d4e4f4" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] }
]

// Dark theme map styles - Better street visibility
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575", visibility: "on" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "on" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] }
]

// Cluster marker for grouped agencies
const ClusterMarker: React.FC<{
  cluster: {
    id: string
    agencies: Agency[]
    center: { lat: number; lng: number }
  }
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  isHovered: boolean
}> = ({ cluster, onClick, onMouseEnter, onMouseLeave, isHovered }) => {
  return (
    <div
      className="relative cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isHovered ? 1.05 : 1,
          opacity: 1 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20 
        }}
        className="relative"
      >
        {/* Cluster circle */}
        <motion.div 
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center",
            "bg-blue-500 text-white",
            "shadow-lg transition-shadow duration-300",
            "border-2 border-white",
            isHovered && "shadow-xl ring-4 ring-blue-500/20"
          )}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.span 
            className="font-bold text-lg"
            initial={{ scale: 1 }}
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {cluster.agencies.length}
          </motion.span>
        </motion.div>
        
        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
            >
              <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2">
                <div className="text-sm font-medium">
                  {cluster.agencies.length} talleres
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Click para acercar
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1">
                <div className="w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Simple location pin marker
const PremiumMarker: React.FC<{
  agency: Agency
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  zoomLevel?: number
}> = ({ agency, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
  return (
    <div 
      className="relative cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="agency-marker"
      data-agency-id={agency.id}
      style={{ zIndex: isHovered ? 1000 : isSelected ? 100 : 50 }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isHovered ? 1.1 : 1,
          y: isHovered ? -2 : 0,
          opacity: 1
        }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          mass: 0.8
        }}
        whileHover={{
          transition: { duration: 0.2 }
        }}
        className="relative"
      >
        {/* Location pin */}
        <motion.div 
          className={cn(
            "relative w-12 h-12 rounded-full flex items-center justify-center",
            "shadow-lg transition-all duration-300 ease-out",
            isSelected 
              ? "bg-blue-600" 
              : "bg-slate-700",
            isHovered && "shadow-xl ring-4 ring-white/20"
          )}
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ rotate: { duration: 0.5 } }}
        >
          <motion.div
            animate={{ 
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <FiMapPin className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>
        
        
        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.2 
              }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 pointer-events-none"
            >
              <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 whitespace-nowrap">
                <div className="font-medium text-sm">{agency.name}</div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <div className="flex items-center gap-1">
                    <FiStar className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{agency.rating}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span>{agency.distance} km</span>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1">
                <div className="w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </motion.div>
    </div>
  )
}

// Agency list item for sidebar
const AgencyListItem: React.FC<{
  agency: Agency
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
  onViewDetails: () => void
}> = ({ agency, isSelected, isHovered, onSelect, onHover, onLeave, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "relative p-4 rounded-xl border transition-all cursor-pointer",
        isSelected 
          ? "bg-primary/5 border-primary" 
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800",
        isHovered && "shadow-lg border-gray-300 dark:border-gray-700"
      )}
      onClick={onViewDetails}
      data-testid="agency-list-item"
      data-agency-id={agency.id}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-base line-clamp-1" data-testid="agency-name">{agency.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{agency.address}</p>
          </div>
          <Badge variant={agency.isHighRated ? "default" : "secondary"} className="shrink-0" data-testid="agency-rating">
            <FiStar className="w-3 h-3 mr-1" />
            {agency.rating}
          </Badge>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <FiMessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span data-testid="agency-reviews">{agency.reviewCount} reseñas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiMapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span data-testid="agency-distance">{agency.distance}</span>
          </div>
        </div>

        {/* Specialties preview */}
        <div className="flex flex-wrap gap-1">
          {agency.specialties.slice(0, 2).map((spec, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {spec}
            </Badge>
          ))}
          {agency.specialties.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{agency.specialties.length - 2}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant={isSelected ? "secondary" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="h-8"
            data-testid="select-button"
          >
            <FiCheck className={cn("w-4 h-4", !isSelected && "mr-1")} />
            {!isSelected && "Seleccionar"}
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <FiBookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <FiShare2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Agency detail panel
const AgencyDetailPanel: React.FC<{
  agency: Agency
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
  onGetDirections: () => void
}> = ({ agency, isSelected, onSelect, onClose, onGetDirections }) => {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Card className="absolute top-4 right-4 w-[420px] max-h-[calc(100vh-32px)] overflow-hidden shadow-2xl" data-testid="agency-detail-panel">
      <div className="relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold line-clamp-1" data-testid="agency-name">{agency.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{agency.address}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 -mr-2 -mt-2"
            >
              <FiX className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FiStar className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-semibold">{agency.rating}</span>
              <span className="text-sm text-muted-foreground">({agency.reviewCount})</span>
            </div>
            <Badge variant={agency.isHighRated ? "default" : "secondary"}>
              {agency.isHighRated ? "Destacada" : "Estándar"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <FiClock className="w-3 h-3" />
              {agency.hours}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1" data-testid="tabs">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">General</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1" data-testid="tab-reviews">Reseñas</TabsTrigger>
            <TabsTrigger value="details" className="flex-1" data-testid="tab-details">Detalles</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value="overview" className="p-6 space-y-4">
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-10 justify-start"
                  onClick={onGetDirections}
                >
                  <FiNavigation className="w-4 h-4 mr-2" />
                  Cómo llegar
                </Button>
                <Button variant="outline" className="h-10 justify-start">
                  <FiPhone className="w-4 h-4 mr-2" />
                  Llamar
                </Button>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                {agency.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FiPhone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{agency.phone}</p>
                    </div>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FiGlobe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sitio web</p>
                      <a href={agency.website} target="_blank" rel="noopener noreferrer" 
                         className="font-medium text-primary hover:underline">
                        Visitar sitio
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Specialties */}
              <div>
                <h3 className="font-semibold mb-3">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {agency.specialties.map((spec, idx) => (
                    <Badge key={idx} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Opening hours */}
              {agency.openingHours && (
                <div>
                  <h3 className="font-semibold mb-3">Horarios</h3>
                  <div className="space-y-1">
                    {agency.openingHours.map((hour, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{hour.split(':')[0]}</span>
                        <span>{hour.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="p-6">
              {agency.recentReviews && agency.recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {agency.recentReviews.map((review, idx) => (
                    <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{review.author}</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={cn(
                                "w-3 h-3",
                                i < review.rating 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay reseñas disponibles
                </p>
              )}
            </TabsContent>

            <TabsContent value="details" className="p-6">
              {agency.analysis ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Análisis</h3>
                    <p className="text-sm text-muted-foreground">{agency.analysis.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Fortalezas</h4>
                    <ul className="space-y-1">
                      {agency.analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <FiCheck className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay análisis disponible
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer actions */}
        <div className="p-6 pt-4 border-t bg-gray-50 dark:bg-gray-900/50">
          <Button
            className="w-full"
            variant={isSelected ? "secondary" : "default"}
            onClick={onSelect}
          >
            {isSelected ? (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                Seleccionada para análisis
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

export function AgencyMapDesktop({
  agencies,
  searchLocation,
  selectedAgencies,
  onAgencySelect,
  onStartAnalysis,
  isLoading = false
}: AgencyMapDesktopProps) {
  const { theme } = useTheme()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [hoveredAgency, setHoveredAgency] = useState<string | null>(null)
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split')
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap')
  const [showFilters, setShowFilters] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(13)

  // Filter agencies based on search
  const filteredAgencies = useMemo(() => {
    if (!searchTerm) return agencies
    const term = searchTerm.toLowerCase()
    return agencies.filter(agency => 
      agency.name.toLowerCase().includes(term) ||
      agency.address.toLowerCase().includes(term) ||
      agency.specialties.some(s => s.toLowerCase().includes(term))
    )
  }, [agencies, searchTerm])
  
  // Simple clustering logic for overlapping markers
  const clusteredAgencies = useMemo(() => {
    const clusters: Array<{
      id: string
      agencies: Agency[]
      center: { lat: number; lng: number }
    }> = []
    
    if (zoomLevel >= 15) {
      // No clustering at high zoom
      return { clusters: [], individual: filteredAgencies }
    }
    
    const processed = new Set<string>()
    const clusterRadius = zoomLevel < 13 ? 0.01 : 0.005 // Degrees
    
    filteredAgencies.forEach(agency => {
      if (processed.has(agency.id)) return
      
      // Find nearby agencies
      const nearbyAgencies = filteredAgencies.filter(other => {
        if (processed.has(other.id)) return false
        const distance = Math.sqrt(
          Math.pow(agency.coordinates.lat - other.coordinates.lat, 2) +
          Math.pow(agency.coordinates.lng - other.coordinates.lng, 2)
        )
        return distance < clusterRadius
      })
      
      if (nearbyAgencies.length > 1) {
        // Create cluster
        nearbyAgencies.forEach(a => processed.add(a.id))
        const avgLat = nearbyAgencies.reduce((sum, a) => sum + a.coordinates.lat, 0) / nearbyAgencies.length
        const avgLng = nearbyAgencies.reduce((sum, a) => sum + a.coordinates.lng, 0) / nearbyAgencies.length
        
        clusters.push({
          id: `cluster-${agency.id}`,
          agencies: nearbyAgencies,
          center: { lat: avgLat, lng: avgLng }
        })
      } else {
        processed.add(agency.id)
      }
    })
    
    return { clusters, individual: filteredAgencies.filter(a => !processed.has(a.id)) }
  }, [filteredAgencies, zoomLevel])

  // Calculate map bounds
  const bounds = useMemo(() => {
    const bounds = new google.maps.LatLngBounds()
    if (searchLocation) bounds.extend(searchLocation)
    filteredAgencies.forEach(agency => bounds.extend(agency.coordinates))
    return bounds
  }, [filteredAgencies, searchLocation])

  // Center map on hovered agency
  useEffect(() => {
    if (map && hoveredAgency) {
      const agency = agencies.find(a => a.id === hoveredAgency)
      if (agency) {
        map.panTo(agency.coordinates)
      }
    }
  }, [hoveredAgency, map, agencies])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAgency(null)
      } else if (e.key === 'Enter' && e.ctrlKey && selectedAgencies.length > 0) {
        onStartAnalysis()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAgencies, onStartAnalysis])

  const handleGetDirections = (agency: Agency) => {
    const origin = searchLocation ? `${searchLocation.lat},${searchLocation.lng}` : ''
    const destination = `${agency.coordinates.lat},${agency.coordinates.lng}`
    window.open(`https://www.google.com/maps/dir/${origin}/${destination}`, '_blank')
  }

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    map.fitBounds(bounds)
    
    // Track zoom level changes
    map.addListener('zoom_changed', () => {
      const currentZoom = map.getZoom()
      if (currentZoom) {
        setZoomLevel(currentZoom)
      }
    })
  }, [bounds])

  return (
    <div className="relative w-full h-screen bg-gray-50 dark:bg-gray-900" data-testid="desktop-map">
      {/* Header toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar agencias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[300px]"
                data-testid="search-input"
              />
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1" data-testid="view-mode-toggle">
              <Button
                variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="h-8 px-3"
                data-testid="view-mode-split"
              >
                <FiGrid className="w-4 h-4 mr-1" />
                División
              </Button>
              <Button
                variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="h-8 px-3"
                data-testid="view-mode-map"
              >
                <FiMap className="w-4 h-4 mr-1" />
                Mapa
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
                data-testid="view-mode-list"
              >
                <FiFilter className="w-4 h-4 mr-1" />
                Lista
              </Button>
            </div>

            {/* Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
              data-testid="filters-button"
            >
              <FiFilter className="w-4 h-4 mr-2" />
              Filtros
              {showFilters && <FiChevronUp className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Selection info */}
            <div className="text-sm text-muted-foreground">
              {filteredAgencies.length} agencias • <span data-testid="selected-count">{selectedAgencies.length}</span> seleccionadas
            </div>

            {/* Action buttons */}
            {selectedAgencies.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
                data-testid="compare-button"
              >
                <FiBarChart2 className="w-4 h-4 mr-2" />
                Comparar
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={onStartAnalysis}
              disabled={selectedAgencies.length === 0 || isLoading}
              data-testid="analyze-button"
            >
              <FiTrendingUp className="w-4 h-4 mr-2" />
              Analizar ({selectedAgencies.length})
            </Button>
          </div>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50" data-testid="filters-panel">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" data-testid="filter-rating">
                    <FiStar className="w-4 h-4 mr-2" />
                    Rating 4.0+
                  </Button>
                  <Button variant="outline" size="sm" data-testid="filter-distance">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    &lt; 5 km
                  </Button>
                  <Button variant="outline" size="sm" data-testid="filter-open-now">
                    <FiClock className="w-4 h-4 mr-2" />
                    Abierto ahora
                  </Button>
                  <Button variant="outline" size="sm">
                    <FiDollarSign className="w-4 h-4 mr-2" />
                    Precio
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="flex h-full pt-[73px]">
        {/* Sidebar - Agency list */}
        {viewMode !== 'map' && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className={cn(
              "bg-white dark:bg-gray-900 border-r overflow-hidden",
              viewMode === 'list' ? 'flex-1' : 'w-[400px]'
            )}
            data-testid="agency-sidebar"
          >
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {filteredAgencies.map((agency) => (
                  <AgencyListItem
                    key={agency.id}
                    agency={agency}
                    isSelected={selectedAgencies.includes(agency.id)}
                    isHovered={hoveredAgency === agency.id}
                    onSelect={() => onAgencySelect(agency.id)}
                    onHover={() => setHoveredAgency(agency.id)}
                    onLeave={() => setHoveredAgency(null)}
                    onViewDetails={() => setSelectedAgency(agency.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Map */}
        {viewMode !== 'list' && (
          <div className="flex-1 relative" data-testid="map-container">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={searchLocation || { lat: 19.4326, lng: -99.1332 }}
              zoom={13}
              onLoad={onMapLoad}
              options={{
                styles: theme === 'dark' ? darkMapStyles : lightMapStyles,
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_CENTER,
                },
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeId: mapType
              }}
            >
              {/* Search location marker */}
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
                    <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 rounded-full animate-ping opacity-20" />
                    <div className="relative w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full shadow-lg" />
                  </motion.div>
                </OverlayView>
              )}

              {/* Cluster markers */}
              {clusteredAgencies.clusters.map((cluster) => (
                <OverlayView
                  key={cluster.id}
                  position={cluster.center}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <ClusterMarker
                    cluster={cluster}
                    isHovered={hoveredAgency === cluster.id}
                    onClick={() => {
                      // Zoom in to show individual markers
                      if (map) {
                        map.setCenter(cluster.center)
                        map.setZoom(Math.min(zoomLevel + 2, 18))
                      }
                    }}
                    onMouseEnter={() => setHoveredAgency(cluster.id)}
                    onMouseLeave={() => setHoveredAgency(null)}
                  />
                </OverlayView>
              ))}
              
              {/* Individual agency markers */}
              {clusteredAgencies.individual.map((agency) => (
                <OverlayView
                  key={agency.id}
                  position={agency.coordinates}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <PremiumMarker
                    agency={agency}
                    isSelected={selectedAgencies.includes(agency.id)}
                    isHovered={hoveredAgency === agency.id}
                    onClick={() => setSelectedAgency(agency.id)}
                    onMouseEnter={() => setHoveredAgency(agency.id)}
                    onMouseLeave={() => setHoveredAgency(null)}
                    zoomLevel={zoomLevel}
                  />
                </OverlayView>
              ))}
            </GoogleMap>

            {/* Map controls */}
            <div className="absolute bottom-4 left-4 space-y-2">
              {/* Map type selector */}
              <Card className="p-1">
                <div className="flex gap-1">
                  <Button
                    variant={mapType === 'roadmap' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMapType('roadmap')}
                    className="h-8 px-3"
                    data-testid="map-type-roadmap"
                  >
                    Mapa
                  </Button>
                  <Button
                    variant={mapType === 'satellite' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMapType('satellite')}
                    className="h-8 px-3"
                    data-testid="map-type-satellite"
                  >
                    Satélite
                  </Button>
                  <Button
                    variant={mapType === 'terrain' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMapType('terrain')}
                    className="h-8 px-3"
                    data-testid="map-type-terrain"
                  >
                    Terreno
                  </Button>
                </div>
              </Card>

              {/* Fit bounds button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => map?.fitBounds(bounds)}
                className="h-9"
                data-testid="fit-bounds-button"
              >
                <FiMaximize2 className="w-4 h-4 mr-2" />
                Ajustar vista
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Agency detail panel */}
      <AnimatePresence>
        {selectedAgency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none"
          >
            <div 
              className="absolute inset-0 bg-black/20"
              onClick={() => setSelectedAgency(null)}
              style={{ pointerEvents: 'auto' }}
            />
            <div style={{ pointerEvents: 'auto' }}>
              <AgencyDetailPanel
                agency={agencies.find(a => a.id === selectedAgency)!}
                isSelected={selectedAgencies.includes(selectedAgency)}
                onSelect={() => onAgencySelect(selectedAgency)}
                onClose={() => setSelectedAgency(null)}
                onGetDirections={() => handleGetDirections(agencies.find(a => a.id === selectedAgency)!)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison modal */}
      <div data-testid="comparison-modal">
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
    </div>
  )
}