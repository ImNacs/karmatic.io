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
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
  FiMinimize2
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
  
  if (typeof window === 'undefined') {
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
  return todayHours.includes('–')
}

// Review card component with responsive design
const ReviewCard: React.FC<{ review: NonNullable<AgencyData['reviews']>[0] }> = ({ review }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2",
      "hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors duration-200",
      "border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    )}
  >
    <div className="flex items-center justify-between flex-wrap gap-2">
      <h4 className="font-medium text-sm md:text-base">{review.author_name}</h4>
      <span className="text-xs md:text-sm text-muted-foreground">{review.relative_time_description}</span>
    </div>
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <FiStar 
          key={i} 
          className={cn(
            "w-3 h-3 md:w-4 md:h-4",
            i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
          )}
        />
      ))}
    </div>
    <p className="text-sm md:text-base text-muted-foreground line-clamp-3 md:line-clamp-none">{review.text}</p>
  </motion.div>
)

export function AgencyCardLocationMapEnhanced({
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const controls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  
  const currentAgency = agencies[currentIndex]
  const isSelected = selectedAgencies.includes(currentAgency.place_id)
  const isOpen = isOpenNow(currentAgency.opening_hours)

  // Detect viewport size
  useEffect(() => {
    const checkViewportSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setViewportSize('mobile')
      } else if (width < 1024) {
        setViewportSize('tablet')
      } else {
        setViewportSize('desktop')
      }
    }

    checkViewportSize()
    window.addEventListener('resize', checkViewportSize)
    return () => window.removeEventListener('resize', checkViewportSize)
  }, [])

  // Handle swipe navigation
  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const threshold = viewportSize === 'mobile' ? 50 : 100
    
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      onNavigate(currentIndex - 1)
    } else if (info.offset.x < -threshold && currentIndex < agencies.length - 1) {
      setCurrentIndex(currentIndex + 1)
      onNavigate(currentIndex + 1)
    }
    
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

  // Get responsive classes
  const getContainerClasses = () => {
    const base = "fixed z-50"
    
    if (viewportSize === 'mobile') {
      return cn(base, "inset-x-0 bottom-0 h-full")
    } else if (viewportSize === 'tablet') {
      return cn(base, isFullscreen 
        ? "inset-0" 
        : "inset-x-4 bottom-4 h-[85vh] max-w-2xl mx-auto"
      )
    } else { // desktop
      return cn(base, isFullscreen 
        ? "inset-0" 
        : "inset-x-0 inset-y-0 md:inset-x-auto md:right-4 md:top-4 md:bottom-4 w-full md:w-[480px] lg:w-[520px] xl:w-[600px]"
      )
    }
  }

  const getCardClasses = () => {
    const base = "relative bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
    
    if (viewportSize === 'mobile') {
      return cn(base, "h-full rounded-t-3xl")
    } else if (viewportSize === 'tablet') {
      return cn(base, "h-full rounded-2xl")
    } else { // desktop
      return cn(base, "h-full rounded-2xl border border-gray-200 dark:border-gray-800")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={getContainerClasses()}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "absolute inset-0 bg-black/50",
          viewportSize === 'desktop' ? "hidden" : "block"
        )}
        onClick={onClose}
      />

      {/* Card container */}
      <motion.div
        initial={{ 
          y: viewportSize === 'mobile' ? '100%' : 0,
          x: viewportSize === 'desktop' ? '100%' : 0,
          scale: viewportSize === 'tablet' ? 0.9 : 1
        }}
        animate={{ 
          y: 0,
          x: 0,
          scale: 1
        }}
        exit={{ 
          y: viewportSize === 'mobile' ? '100%' : 0,
          x: viewportSize === 'desktop' ? '100%' : 0,
          scale: viewportSize === 'tablet' ? 0.9 : 1
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative h-full"
      >
        <motion.div
          ref={cardRef}
          drag={viewportSize === 'desktop' ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDrag={(_, info) => setDragOffset(info.offset.x)}
          onDragEnd={handleDragEnd}
          animate={controls}
          className={getCardClasses()}
        >
          {/* Pull indicator for mobile */}
          {viewportSize === 'mobile' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full z-20" />
          )}

          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 md:p-5 pt-8 md:pt-5">
              <div className="flex items-center gap-3 flex-1">
                {viewportSize === 'mobile' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                  >
                    <FiChevronDown className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg md:text-xl lg:text-2xl leading-tight line-clamp-1">
                    {currentAgency.name}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {currentIndex + 1} de {agencies.length} agencias
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {viewportSize !== 'mobile' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="hidden md:flex"
                  >
                    {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className={viewportSize === 'mobile' ? 'hidden' : 'flex'}
                >
                  <FiX className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Navigation - Different styles for different viewports */}
            {viewportSize === 'desktop' ? (
              <div className="flex items-center justify-between px-5 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentIndex > 0) {
                      setCurrentIndex(currentIndex - 1)
                      onNavigate(currentIndex - 1)
                    }
                  }}
                  disabled={currentIndex === 0}
                  className="gap-2"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-2">
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
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentIndex < agencies.length - 1) {
                      setCurrentIndex(currentIndex + 1)
                      onNavigate(currentIndex + 1)
                    }
                  }}
                  disabled={currentIndex === agencies.length - 1}
                  className="gap-2"
                >
                  Siguiente
                  <FiChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
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
            )}
          </div>

          {/* Content with responsive layout */}
          <div className={cn(
            "overflow-y-auto",
            viewportSize === 'mobile' ? "h-[calc(100%-8rem)]" : "h-[calc(100%-10rem)]"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAgency.place_id}
                initial={{ opacity: 0, x: dragOffset > 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dragOffset > 0 ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "space-y-4 md:space-y-6",
                  viewportSize === 'desktop' ? "p-6" : "p-4 md:p-5"
                )}
              >
                {/* Rating and reviews - Responsive grid */}
                <div className={cn(
                  "flex items-center justify-between flex-wrap gap-3",
                  viewportSize === 'desktop' && "bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4"
                )}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-1">
                      <FiStar className="w-5 h-5 md:w-6 md:h-6 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-lg md:text-xl">{currentAgency.rating}</span>
                    </div>
                    <div className="text-sm md:text-base text-muted-foreground">
                      <FiUsers className="inline w-4 h-4 md:w-5 md:h-5 mr-1" />
                      {currentAgency.user_ratings_total.toLocaleString()} reseñas
                    </div>
                  </div>
                  <Badge 
                    variant={isOpen ? "default" : "secondary"}
                    className={cn(
                      "font-medium text-sm md:text-base px-3 py-1",
                      isOpen && "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                    )}
                  >
                    {isOpen ? 'Abierto ahora' : 'Cerrado'}
                  </Badge>
                </div>

                {/* Quick info - Responsive grid */}
                <div className={cn(
                  "grid gap-3 md:gap-4",
                  viewportSize === 'desktop' ? "grid-cols-2" : "grid-cols-1"
                )}>
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-medium">Dirección</p>
                      <p className="text-sm md:text-base text-muted-foreground">{currentAgency.address}</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-medium">Horario de hoy</p>
                      <p className="text-sm md:text-base text-muted-foreground">{getTodayHours(currentAgency.opening_hours)}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  {currentAgency.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <FiPhone className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm md:text-base font-medium">Teléfono</p>
                        <a 
                          href={`tel:${currentAgency.phone}`}
                          className="text-sm md:text-base text-primary hover:underline"
                        >
                          {currentAgency.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {currentAgency.website && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <FiGlobe className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm md:text-base font-medium">Sitio web</p>
                        <a 
                          href={currentAgency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm md:text-base text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Visitar sitio <FiExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons - Responsive layout */}
                <div className={cn(
                  "grid gap-3",
                  viewportSize === 'mobile' ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"
                )}>
                  <Button
                    variant="outline"
                    className="w-full h-10 md:h-12 text-sm md:text-base"
                    onClick={() => onGetDirections(currentAgency)}
                  >
                    <FiNavigation className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Cómo llegar
                  </Button>
                  <Button
                    variant={isSelected ? "secondary" : "default"}
                    className="w-full h-10 md:h-12 text-sm md:text-base"
                    onClick={handleSelect}
                  >
                    <FiCheck className={cn("w-4 h-4 md:w-5 md:h-5 mr-2", isSelected && "text-primary")} />
                    {isSelected ? 'Seleccionada' : 'Seleccionar'}
                  </Button>
                </div>

                {/* Reviews section - Enhanced for larger screens */}
                {currentAgency.reviews && currentAgency.reviews.length > 0 && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-base md:text-lg flex items-center gap-2">
                        <FiMessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                        Reseñas recientes
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullCard(!showFullCard)}
                        className="text-sm md:text-base"
                      >
                        {showFullCard ? 'Ver menos' : `Ver todas (${currentAgency.reviews.length})`}
                      </Button>
                    </div>
                    
                    <div className={cn(
                      "space-y-3",
                      viewportSize === 'desktop' && showFullCard && "grid grid-cols-2 gap-4 space-y-0"
                    )}>
                      {currentAgency.reviews
                        .slice(0, showFullCard ? undefined : (viewportSize === 'desktop' ? 3 : 2))
                        .map((review, index) => (
                          <ReviewCard key={index} review={review} />
                        ))}
                    </div>
                  </div>
                )}

                {/* All hours (expandable) - Enhanced layout */}
                {currentAgency.opening_hours && currentAgency.opening_hours.length > 0 && showFullCard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 md:space-y-3"
                  >
                    <h4 className="font-medium text-base md:text-lg flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 md:w-5 md:h-5" />
                      Horario completo
                    </h4>
                    <div className={cn(
                      "bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 md:p-4",
                      viewportSize === 'desktop' && "grid grid-cols-2 gap-x-8 gap-y-2"
                    )}>
                      {currentAgency.opening_hours.map((hour, index) => (
                        <div key={index} className="text-sm md:text-base flex justify-between">
                          <span className="capitalize font-medium">{hour.split(': ')[0]}</span>
                          <span className="text-muted-foreground">{hour.split(': ')[1]}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom bar with swipe hint - Only for mobile/tablet */}
          {viewportSize !== 'desktop' && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none">
              <div className="p-4 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-xs md:text-sm text-muted-foreground flex items-center gap-2"
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
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}