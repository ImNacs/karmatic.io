"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FiStar,
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiClock,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiNavigation,
  FiExternalLink,
  FiCalendar,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiShare2,
  FiBookmark,
  FiPrinter,
  FiBarChart2,
  FiTrendingUp,
  FiImage,
  FiInfo,
  FiShield,
  FiAward,
  FiDollarSign,
  FiZap,
  FiThumbsUp,
  FiAlertCircle,
  FiCopy,
  FiMail,
  FiFilter
} from 'react-icons/fi'
import { GoogleMap, Marker } from '@react-google-maps/api'

interface AgencyData {
  place_id: string
  name: string
  address: string
  rating: number
  user_ratings_total: number
  location: {
    lat: number
    lng: number
  }
  google_maps_url: string
  website?: string
  phone?: string
  opening_hours?: string[]
  reviews?: Array<{
    author_name: string
    rating: number
    relative_time_description: string
    text: string
  }>
  business_status: string
  vicinity: string
}

interface AgencyDetailDesktopProps {
  agencies: AgencyData[]
  currentAgencyIndex: number
  selectedAgencies: string[]
  onAgencySelect: (placeId: string) => void
  onClose: () => void
  onNavigate: (index: number) => void
  onGetDirections: (agency: AgencyData) => void
  onCompareAgencies?: () => void
}

// Helper functions
const getTodayHours = (hours: string[] | undefined): string => {
  if (!hours || hours.length === 0) return 'Horario no disponible'
  
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const today = days[new Date().getDay()]
  
  const todayHours = hours.find(h => h.toLowerCase().startsWith(today))
  if (todayHours) {
    const time = todayHours.split(': ')[1]
    return time || 'Cerrado'
  }
  
  return 'Horario no disponible'
}

const isOpenNow = (hours: string[] | undefined): boolean => {
  const todayHours = getTodayHours(hours)
  if (todayHours === 'Cerrado' || todayHours === 'Horario no disponible') return false
  return todayHours.includes('–')
}

// Calculate rating distribution
const getRatingDistribution = (reviews: AgencyData['reviews']) => {
  if (!reviews || reviews.length === 0) return Array(5).fill(0)
  
  const distribution = Array(5).fill(0)
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[5 - review.rating]++
    }
  })
  return distribution
}

// Premium Review Card
const ReviewCard: React.FC<{ 
  review: NonNullable<AgencyData['reviews']>[0],
  highlighted?: boolean 
}> = ({ review, highlighted = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    className={cn(
      "bg-white dark:bg-gray-900 rounded-xl p-6 space-y-3",
      "border transition-all duration-200",
      highlighted 
        ? "border-primary shadow-lg shadow-primary/10" 
        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
      "hover:shadow-md"
    )}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-sm font-semibold">{review.author_name.charAt(0)}</span>
        </div>
        <div>
          <h4 className="font-semibold text-base">{review.author_name}</h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar 
                  key={i} 
                  className={cn(
                    "w-4 h-4",
                    i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{review.relative_time_description}</span>
          </div>
        </div>
      </div>
      {highlighted && (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <FiThumbsUp className="w-3 h-3 mr-1" />
          Destacada
        </Badge>
      )}
    </div>
    <p className="text-base text-muted-foreground leading-relaxed">{review.text}</p>
  </motion.div>
)

// Stats Card Component
const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: number
  color?: string
}> = ({ icon, label, value, trend, color = "primary" }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
  >
    <div className="flex items-start justify-between">
      <div className={cn("p-2 rounded-lg", `bg-${color}-50 dark:bg-${color}-900/20`)}>
        {icon}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-sm",
          trend > 0 ? "text-green-600" : "text-red-600"
        )}>
          <FiTrendingUp className={cn("w-4 h-4", trend < 0 && "rotate-180")} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </motion.div>
)

export function AgencyDetailDesktop({
  agencies,
  currentAgencyIndex,
  selectedAgencies,
  onAgencySelect,
  onClose,
  onNavigate,
  onGetDirections,
  onCompareAgencies
}: AgencyDetailDesktopProps) {
  const [currentIndex, setCurrentIndex] = useState(currentAgencyIndex)
  const [activeTab, setActiveTab] = useState("overview")
  const [showStreetView, setShowStreetView] = useState(false)
  const [savedAgencies, setSavedAgencies] = useState<string[]>([])
  const [copiedPhone, setCopiedPhone] = useState(false)
  
  const currentAgency = agencies[currentIndex]
  const isSelected = selectedAgencies.includes(currentAgency.place_id)
  const isSaved = savedAgencies.includes(currentAgency.place_id)
  const isOpen = isOpenNow(currentAgency.opening_hours)
  const ratingDistribution = getRatingDistribution(currentAgency.reviews)

  const handleSaveAgency = useCallback(() => {
    setSavedAgencies(prev => 
      prev.includes(currentAgency.place_id)
        ? prev.filter(id => id !== currentAgency.place_id)
        : [...prev, currentAgency.place_id]
    )
  }, [currentAgency.place_id])

  const handlePrint = () => {
    window.print()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent conflicts with input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch(e.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            onNavigate(currentIndex - 1)
          }
          break
        case 'ArrowRight':
          if (currentIndex < agencies.length - 1) {
            setCurrentIndex(currentIndex + 1)
            onNavigate(currentIndex + 1)
          }
          break
        case 'Escape':
          onClose()
          break
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleSaveAgency()
          }
          break
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handlePrint()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, agencies.length, onNavigate, onClose, handleSaveAgency])

  const handleSelect = () => {
    onAgencySelect(currentAgency.place_id)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: currentAgency.name,
        text: `Mira esta agencia: ${currentAgency.name}`,
        url: currentAgency.google_maps_url
      })
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(currentAgency.google_maps_url)
    }
  }

  const handleCopyPhone = () => {
    if (currentAgency.phone) {
      navigator.clipboard.writeText(currentAgency.phone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  // Map configuration
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: false,
    fullscreenControl: false
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex"
    >
      {/* Left Panel - Agency List & Map */}
      <div className="w-[500px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Header with Navigation */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Agencias Encontradas</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} de {agencies.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1)
                    onNavigate(currentIndex - 1)
                  }
                }}
                disabled={currentIndex === 0}
              >
                <FiChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (currentIndex < agencies.length - 1) {
                    setCurrentIndex(currentIndex + 1)
                    onNavigate(currentIndex + 1)
                  }
                }}
                disabled={currentIndex === agencies.length - 1}
              >
                <FiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Selected Agencies Bar */}
          {selectedAgencies.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">
                {selectedAgencies.length} agencias seleccionadas
              </span>
              {onCompareAgencies && (
                <Button size="sm" variant="outline" onClick={onCompareAgencies}>
                  <FiBarChart2 className="w-4 h-4 mr-2" />
                  Comparar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Map View */}
        <div className="flex-1 relative">
          {showStreetView ? (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center space-y-4">
                <FiImage className="w-16 h-16 mx-auto text-gray-400" />
                <p className="text-gray-500">Street View no disponible en esta vista</p>
                <Button variant="outline" onClick={() => setShowStreetView(false)}>
                  Volver al mapa
                </Button>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentAgency.location}
              zoom={16}
              options={mapOptions}
            >
              <Marker 
                position={currentAgency.location}
                onClick={() => setShowStreetView(true)}
              />
              {/* Show other agencies as smaller markers */}
              {agencies.map((agency, index) => 
                index !== currentIndex && (
                  <Marker
                    key={agency.place_id}
                    position={agency.location}
                    onClick={() => {
                      setCurrentIndex(index)
                      onNavigate(index)
                    }}
                    icon={{
                      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                      scaledSize: new google.maps.Size(30, 30)
                    }}
                  />
                )
              )}
            </GoogleMap>
          )}
          
          {/* Map Overlay Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStreetView(!showStreetView)}
              className="shadow-lg"
            >
              <FiImage className="w-4 h-4 mr-2" />
              {showStreetView ? 'Ver Mapa' : 'Street View'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onGetDirections(currentAgency)}
              className="shadow-lg"
            >
              <FiNavigation className="w-4 h-4 mr-2" />
              Cómo llegar
            </Button>
          </div>
        </div>

        {/* Agency List Preview */}
        <ScrollArea className="h-48 border-t border-gray-200 dark:border-gray-800">
          <div className="p-4 space-y-2">
            {agencies.map((agency, index) => (
              <motion.div
                key={agency.place_id}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setCurrentIndex(index)
                  onNavigate(index)
                }}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all duration-200",
                  index === currentIndex
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{agency.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <FiStar className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs">{agency.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {agency.user_ratings_total} reseñas
                      </span>
                    </div>
                  </div>
                  {selectedAgencies.includes(agency.place_id) && (
                    <FiCheck className="w-5 h-5 text-primary" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Agency Details */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* Detail Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{currentAgency.name}</h1>
                {isOpen && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <FiClock className="w-3 h-3 mr-1" />
                    Abierto ahora
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  <span>{currentAgency.vicinity}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <FiStar className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-foreground">{currentAgency.rating}</span>
                  <span>({currentAgency.user_ratings_total} reseñas)</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveAgency}
              >
                <FiBookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
              >
                <FiShare2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrint}
              >
                <FiPrinter className="w-5 h-5" />
              </Button>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <Button
                variant={isSelected ? "secondary" : "default"}
                onClick={handleSelect}
                className="gap-2"
              >
                <FiCheck className="w-4 h-4" />
                {isSelected ? 'Seleccionada' : 'Seleccionar para análisis'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <FiX className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              <FiInfo className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              <FiMessageSquare className="w-4 h-4 mr-2" />
              Reseñas ({currentAgency.reviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              <FiBarChart2 className="w-4 h-4 mr-2" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              <FiPhone className="w-4 h-4 mr-2" />
              Contacto
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6 mt-0">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  icon={<FiStar className="w-5 h-5 text-yellow-500" />}
                  label="Calificación"
                  value={currentAgency.rating}
                  color="yellow"
                />
                <StatCard
                  icon={<FiUsers className="w-5 h-5 text-blue-500" />}
                  label="Total Reseñas"
                  value={currentAgency.user_ratings_total.toLocaleString()}
                  trend={12}
                  color="blue"
                />
                <StatCard
                  icon={<FiShield className="w-5 h-5 text-green-500" />}
                  label="Verificado"
                  value="Sí"
                  color="green"
                />
                <StatCard
                  icon={<FiAward className="w-5 h-5 text-purple-500" />}
                  label="Ranking"
                  value={`#${currentIndex + 1}`}
                  color="purple"
                />
              </div>

              {/* Business Information */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FiInfo className="w-5 h-5" />
                  Información del Negocio
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Dirección completa</label>
                      <p className="font-medium">{currentAgency.address}</p>
                    </div>
                    
                    {currentAgency.phone && (
                      <div>
                        <label className="text-sm text-muted-foreground">Teléfono</label>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{currentAgency.phone}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyPhone}
                          >
                            {copiedPhone ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {currentAgency.website && (
                      <div>
                        <label className="text-sm text-muted-foreground">Sitio web</label>
                        <a
                          href={currentAgency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {new URL(currentAgency.website).hostname}
                          <FiExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Estado del negocio</label>
                      <Badge variant="secondary" className="mt-1">
                        {currentAgency.business_status === 'OPERATIONAL' ? 'Operacional' : currentAgency.business_status}
                      </Badge>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Horario de hoy</label>
                      <p className="font-medium">{getTodayHours(currentAgency.opening_hours)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              {currentAgency.opening_hours && (
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <FiCalendar className="w-5 h-5" />
                    Horario Completo
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {currentAgency.opening_hours.map((hour, index) => {
                      const [day, time] = hour.split(': ')
                      const isToday = day.toLowerCase() === ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date().getDay()]
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex justify-between p-3 rounded-lg",
                            isToday ? "bg-primary/10 font-medium" : "bg-white dark:bg-gray-900"
                          )}
                        >
                          <span className="capitalize">{day}</span>
                          <span className={cn(
                            isToday ? "text-primary" : "text-muted-foreground"
                          )}>{time}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="p-6 space-y-6 mt-0">
              {/* Rating Summary */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Resumen de Calificaciones</h3>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-bold">{currentAgency.rating}</span>
                      <div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={cn(
                                "w-5 h-5",
                                i < Math.floor(currentAgency.rating) 
                                  ? "fill-yellow-500 text-yellow-500" 
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentAgency.user_ratings_total} reseñas totales
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating Distribution */}
                  <div className="space-y-2 min-w-[200px]">
                    {[5, 4, 3, 2, 1].map((stars, index) => {
                      const count = ratingDistribution[index]
                      const percentage = currentAgency.reviews 
                        ? (count / currentAgency.reviews.length) * 100 
                        : 0
                      
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-3">{stars}</span>
                          <FiStar className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-full bg-yellow-500"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-10 text-right">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Todas las Reseñas</h3>
                  <Button variant="outline" size="sm">
                    <FiFilter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
                
                {currentAgency.reviews && currentAgency.reviews.length > 0 ? (
                  <div className="grid gap-4">
                    {currentAgency.reviews.map((review, index) => (
                      <ReviewCard 
                        key={index} 
                        review={review}
                        highlighted={review.rating >= 5}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay reseñas disponibles
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="p-6 space-y-6 mt-0">
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <FiBarChart2 className="w-5 h-5" />
                  Análisis de Rendimiento
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Puntuación de confianza</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '85%' }} />
                        </div>
                        <span className="font-semibold">85%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Tendencia de calificaciones</label>
                      <div className="flex items-center gap-2 mt-1 text-green-600">
                        <FiTrendingUp className="w-4 h-4" />
                        <span className="font-medium">+0.3 en los últimos 6 meses</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Categoría principal</label>
                      <Badge variant="secondary" className="mt-1">
                        Agencia Automotriz Premium
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Fortalezas detectadas</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">Atención al cliente</Badge>
                        <Badge variant="outline">Precios competitivos</Badge>
                        <Badge variant="outline">Ubicación</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Áreas de mejora</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          Tiempos de espera
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Alert */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Selecciona más agencias para ver un análisis comparativo detallado
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Actualmente tienes {selectedAgencies.length} de 3 agencias seleccionadas
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="p-6 space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-6">
                {/* Contact Methods */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Métodos de Contacto</h3>
                  
                  {currentAgency.phone && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl cursor-pointer"
                      onClick={() => window.open(`tel:${currentAgency.phone}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FiPhone className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Llamar ahora</p>
                          <p className="text-sm text-muted-foreground">{currentAgency.phone}</p>
                        </div>
                        <FiExternalLink className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  )}
                  
                  {currentAgency.website && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl cursor-pointer"
                      onClick={() => window.open(currentAgency.website, '_blank')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FiGlobe className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Visitar sitio web</p>
                          <p className="text-sm text-muted-foreground">
                            {new URL(currentAgency.website).hostname}
                          </p>
                        </div>
                        <FiExternalLink className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl cursor-pointer"
                    onClick={() => window.open(currentAgency.google_maps_url, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FiMapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ver en Google Maps</p>
                        <p className="text-sm text-muted-foreground">Obtener direcciones</p>
                      </div>
                      <FiExternalLink className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
                  
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      Agendar visita
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FiMail className="w-4 h-4 mr-2" />
                      Solicitar cotización
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FiMessageSquare className="w-4 h-4 mr-2" />
                      Enviar mensaje
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FiDollarSign className="w-4 h-4 mr-2" />
                      Ver financiamiento
                    </Button>
                  </div>
                </div>
              </div>

              {/* Business Hours Card */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FiZap className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {isOpen ? 'La agencia está abierta ahora' : 'La agencia está cerrada'}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Horario de hoy: {getTodayHours(currentAgency.opening_hours)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Keyboard Shortcuts Help */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">←</kbd>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">→</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">Esc</kbd>
              Cerrar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">Ctrl</kbd>+
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">S</kbd>
              Guardar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">Ctrl</kbd>+
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">P</kbd>
              Imprimir
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}