"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FiStar,
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiClock,
  FiCheck,
  FiX,
  FiChevronDown,
  FiMessageSquare,
  FiNavigation,
  FiExternalLink,
  FiCalendar,
  FiUsers
} from 'react-icons/fi'

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

interface AgencyCardLocationMapProps {
  agencies: AgencyData[]
  currentAgencyIndex: number
  selectedAgencies: string[]
  onAgencySelect: (placeId: string) => void
  onClose: () => void
  onNavigate: (index: number) => void
  onGetDirections: (agency: AgencyData) => void
}

// Helper function to get today's opening hours
const getTodayHours = (hours: string[] | undefined): string => {
  if (!hours || hours.length === 0) return 'Horario no disponible'
  
  // Use a stable way to get the day - will be consistent between server and client
  if (typeof window === 'undefined') {
    // Server-side: return first available hours
    return hours[0]?.split(': ')[1] || 'Horario no disponible'
  }
  
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const today = days[new Date().getDay()]
  
  const todayHours = hours.find(h => h.toLowerCase().startsWith(today))
  if (todayHours) {
    const time = todayHours.split(': ')[1]
    return time || 'Cerrado'
  }
  
  return 'Horario no disponible'
}

// Helper function to check if currently open
const isOpenNow = (hours: string[] | undefined): boolean => {
  const todayHours = getTodayHours(hours)
  if (todayHours === 'Cerrado' || todayHours === 'Horario no disponible') return false
  
  // Simple check - can be enhanced with actual time comparison
  return todayHours.includes('–')
}

// Review card component
const ReviewCard: React.FC<{ review: NonNullable<AgencyData['reviews']>[0] }> = ({ review }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2"
  >
    <div className="flex items-center justify-between">
      <h4 className="font-medium text-sm">{review.author_name}</h4>
      <span className="text-xs text-muted-foreground">{review.relative_time_description}</span>
    </div>
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <FiStar 
          key={i} 
          className={cn(
            "w-3 h-3",
            i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
          )}
        />
      ))}
    </div>
    <p className="text-sm text-muted-foreground line-clamp-3">{review.text}</p>
  </motion.div>
)

export function AgencyCardLocationMap({
  agencies,
  currentAgencyIndex,
  selectedAgencies,
  onAgencySelect,
  onClose,
  onNavigate,
  onGetDirections
}: AgencyCardLocationMapProps) {
  const [currentIndex, setCurrentIndex] = useState(currentAgencyIndex)
  const [dragOffset, setDragOffset] = useState(0)
  const [showFullCard, setShowFullCard] = useState(false)
  const controls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const currentAgency = agencies[currentIndex]
  const isSelected = selectedAgencies.includes(currentAgency.place_id)
  const isOpen = isOpenNow(currentAgency.opening_hours)

  // Handle swipe navigation
  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const threshold = 50
    
    if (info.offset.x > threshold && currentIndex > 0) {
      // Swipe right - previous agency
      setCurrentIndex(currentIndex - 1)
      onNavigate(currentIndex - 1)
    } else if (info.offset.x < -threshold && currentIndex < agencies.length - 1) {
      // Swipe left - next agency
      setCurrentIndex(currentIndex + 1)
      onNavigate(currentIndex + 1)
    }
    
    // Reset position
    controls.start({ x: 0 })
    setDragOffset(0)
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
        onNavigate(currentIndex - 1)
      } else if (e.key === 'ArrowRight' && currentIndex < agencies.length - 1) {
        setCurrentIndex(currentIndex + 1)
        onNavigate(currentIndex + 1)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, agencies.length, onNavigate, onClose])

  // Handle selection
  const handleSelect = () => {
    onAgencySelect(currentAgency.place_id)
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 h-full md:h-auto md:max-h-[90vh]"
    >
      {/* Backdrop for mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Card container */}
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(_, info) => setDragOffset(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={cn(
          "relative h-full md:h-auto bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl",
          "shadow-2xl md:mx-4 md:mb-4 overflow-hidden",
          "touch-pan-y"
        )}
      >
        {/* Pull indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full md:hidden" />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 pt-8 md:pt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onClose}
              >
                <FiChevronDown className="w-5 h-5" />
              </Button>
              <div>
                <h3 className="font-semibold text-lg leading-tight">{currentAgency.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentIndex + 1} de {agencies.length} agencias
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {agencies.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  onNavigate(index)
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex 
                    ? "w-8 bg-primary" 
                    : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-8rem)] md:max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAgency.place_id}
              initial={{ opacity: 0, x: dragOffset > 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dragOffset > 0 ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-4"
            >
              {/* Rating and reviews */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <FiStar className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold text-lg">{currentAgency.rating}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <FiUsers className="inline w-4 h-4 mr-1" />
                    {currentAgency.user_ratings_total.toLocaleString()} reseñas
                  </div>
                </div>
                <Badge 
                  variant={isOpen ? "default" : "secondary"}
                  className={cn(
                    "font-medium",
                    isOpen && "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                  )}
                >
                  {isOpen ? 'Abierto ahora' : 'Cerrado'}
                </Badge>
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-1 gap-3">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <FiMapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground">{currentAgency.address}</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <FiClock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Horario de hoy</p>
                    <p className="text-sm text-muted-foreground">{getTodayHours(currentAgency.opening_hours)}</p>
                  </div>
                </div>

                {/* Phone */}
                {currentAgency.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FiPhone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Teléfono</p>
                      <a 
                        href={`tel:${currentAgency.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {currentAgency.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {currentAgency.website && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FiGlobe className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sitio web</p>
                      <a 
                        href={currentAgency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Visitar sitio <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onGetDirections(currentAgency)}
                >
                  <FiNavigation className="w-4 h-4 mr-2" />
                  Cómo llegar
                </Button>
                <Button
                  variant={isSelected ? "secondary" : "default"}
                  className="w-full"
                  onClick={handleSelect}
                >
                  <FiCheck className={cn("w-4 h-4 mr-2", isSelected && "text-primary")} />
                  {isSelected ? 'Seleccionada' : 'Seleccionar'}
                </Button>
              </div>

              {/* Reviews section */}
              {currentAgency.reviews && currentAgency.reviews.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <FiMessageSquare className="w-4 h-4" />
                      Reseñas recientes
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullCard(!showFullCard)}
                    >
                      {showFullCard ? 'Ver menos' : `Ver todas (${currentAgency.reviews.length})`}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {currentAgency.reviews
                      .slice(0, showFullCard ? undefined : 2)
                      .map((review, index) => (
                        <ReviewCard key={index} review={review} />
                      ))}
                  </div>
                </div>
              )}

              {/* All hours (expandable) */}
              {currentAgency.opening_hours && currentAgency.opening_hours.length > 0 && showFullCard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <h4 className="font-medium flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    Horario completo
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-1">
                    {currentAgency.opening_hours.map((hour, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span className="capitalize">{hour.split(': ')[0]}</span>
                        <span className="text-muted-foreground">{hour.split(': ')[1]}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom bar with swipe hint */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none">
          <div className="p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-muted-foreground flex items-center gap-2"
            >
              <motion.div
                animate={{ x: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ← Desliza para navegar →
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}