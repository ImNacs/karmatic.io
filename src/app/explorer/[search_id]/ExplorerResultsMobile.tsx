"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { AgencyMapOptimized } from "@/components/features/agency-map"
import { AgencyDetail } from "@/components/features/agency-detail"
import { LoadingScreen } from "@/components/common/loading-screen"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FiMessageSquare, FiRefreshCw, FiMap } from "react-icons/fi"
import { ChevronLeft, ChevronRight, GripVertical, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatPanel } from "@/components/features/ai-assistant/panels/ChatPanel"
import { ChatPanelMobile } from "@/components/features/ai-assistant/panels/ChatPanelMobile"
import { AIAssistantProvider } from "@/contexts/AIAssistantContext"
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react"
import type { Agency } from "@/types/agency"

interface ExplorerResultsProps {
  searchId: string
  location: string
  query: string | null
  agencies: any[]
  searchCoordinates?: { lat: number; lng: number }
  isAuthenticated: boolean
}

type ViewMode = "map" | "chat" | "split"
type DeviceType = "mobile" | "tablet" | "desktop"

export default function ExplorerResultsMobile({
  searchId,
  location,
  query,
  agencies: initialAgencies,
  searchCoordinates,
  isAuthenticated
}: ExplorerResultsProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<"results" | "analysis" | "chat">("results")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<"search" | "analysis">("search")
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop")
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const router = useRouter()
  
  // Touch gesture values for mobile swipe
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5])
  
  // Mock data for when n8n is not configured
  const mockAgencies: Agency[] = [
    {
      id: "1",
      name: "AutoMax Premium",
      rating: 4.8,
      reviewCount: 245,
      address: "Av. Revolución 1234, Col. Centro",
      phone: "+52 55 1234 5678",
      hours: "Lun-Sab 9:00-19:00",
      distance: "2.3 km",
      coordinates: { lat: 19.4326, lng: -99.1332 },
      isHighRated: true,
      specialties: ["Sedanes", "SUVs", "Autos Premium"],
      website: "https://automax.com",
      description: "Concesionario especializado en vehículos premium con más de 15 años de experiencia en el mercado.",
      images: ["/api/placeholder/400/300"],
      recentReviews: [
        {
          id: "1",
          author: "María González",
          rating: 5,
          comment: "Excelente servicio y atención al cliente. Muy recomendado.",
          date: "2 días"
        },
        {
          id: "2",
          author: "Carlos Rodríguez",
          rating: 4,
          comment: "Buenos precios y variedad de vehículos.",
          date: "1 semana"
        }
      ],
      analysis: {
        summary: "AutoMax Premium se destaca por su excelente servicio al cliente y amplia gama de vehículos premium.",
        strengths: ["Atención personalizada", "Garantía extendida", "Precios competitivos"],
        recommendations: ["Consultar ofertas especiales", "Verificar financiamiento", "Revisar historial del vehículo"]
      }
    },
    {
      id: "2",
      name: "Carros del Valle",
      rating: 4.2,
      reviewCount: 156,
      address: "Calz. de Tlalpan 2456, Col. Vértiz Narvarte",
      phone: "+52 55 9876 5432",
      hours: "Lun-Vie 9:00-18:00",
      distance: "3.1 km",
      coordinates: { lat: 19.4155, lng: -99.1560 },
      isHighRated: true,
      specialties: ["Autos Usados", "Pickups", "Motocicletas"],
      description: "Especialistas en vehículos usados con garantía y financiamiento flexible.",
      images: ["/api/placeholder/400/300"],
      recentReviews: [
        {
          id: "3",
          author: "Ana López",
          rating: 4,
          comment: "Buen inventario de autos usados, precios justos.",
          date: "3 días"
        }
      ],
      analysis: {
        summary: "Carros del Valle ofrece una excelente relación calidad-precio en vehículos usados.",
        strengths: ["Precios competitivos", "Variedad de opciones", "Financiamiento flexible"],
        recommendations: ["Inspeccionar mecánicamente", "Verificar documentos", "Negociar garantía"]
      }
    }
  ]

  // Transform agencies from API format to local format
  const agencies: Agency[] = initialAgencies.length > 0 
    ? initialAgencies.map((agency: any) => ({
        id: agency.id,
        name: agency.name,
        rating: agency.rating || 0,
        reviewCount: agency.userRatingsTotal || 0,
        address: agency.address,
        phone: agency.phoneNumber || '',
        hours: agency.openingHours?.[0] || 'No disponible',
        distance: agency.distance || '',
        coordinates: { lat: agency.latitude, lng: agency.longitude },
        isHighRated: (agency.rating || 0) >= 4.0,
        specialties: [],
        website: agency.website,
        description: '',
        images: [],
        recentReviews: agency.reviews?.slice(0, 3).map((review: any, index: number) => ({
          id: review.time?.toString() || `review-${agency.id}-${index}`,
          author: review.author_name,
          rating: review.rating,
          comment: review.text,
          date: review.relative_time_description
        })) || [],
        placeId: agency.placeId,
        openingHours: agency.openingHours,
        googleMapsUrl: agency.googleMapsUrl,
        businessStatus: agency.businessStatus,
      }))
    : mockAgencies

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      if (width < 640) {
        setDeviceType("mobile")
        setViewMode("map") // Default to map on mobile
      } else if (width < 1024) {
        setDeviceType("tablet")
        setViewMode("split")
      } else {
        setDeviceType("desktop")
        setViewMode("split")
      }
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  // Handle swipe gestures on mobile
  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (deviceType !== "mobile") return
    
    if (direction === "left" && viewMode === "map") {
      setViewMode("chat")
    } else if (direction === "right" && viewMode === "chat") {
      setViewMode("map")
    }
  }, [deviceType, viewMode])

  const handleSelectForAnalysis = (agencyId: string) => {
    setSelectedForAnalysis(prev => {
      if (prev.includes(agencyId)) {
        return prev.filter(id => id !== agencyId)
      } else if (prev.length < 3) {
        return [...prev, agencyId]
      }
      return prev
    })
  }

  const handleStartAnalysis = async () => {
    if (selectedForAnalysis.length === 0) {
      toast.error("Selecciona al menos una agencia para análisis")
      return
    }

    setIsLoading(true)
    setLoadingType("analysis")
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    setCurrentStep("analysis")
    setIsLoading(false)
    
    toast.success("Análisis completado")
  }

  const handleNewSearch = () => {
    router.push('/')
  }

  const selectedAgenciesData = agencies.filter(agency => selectedForAnalysis.includes(agency.id))

  // Mobile bottom tabs component
  const MobileBottomTabs = () => (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden"
    >
      <div className="flex h-16 items-center justify-around px-4">
        <button
          onClick={() => setViewMode("map")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1",
            "transition-all duration-200",
            viewMode === "map" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <FiMap className="w-5 h-5" />
          <span className="text-xs font-medium">Mapa</span>
        </button>
        
        <button
          onClick={() => setViewMode("chat")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1",
            "transition-all duration-200 relative",
            viewMode === "chat" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <FiMessageSquare className="w-5 h-5" />
          <span className="text-xs font-medium">Chat</span>
          {/* Notification badge */}
          <span className="absolute top-1 right-1/4 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
        </button>
      </div>
    </motion.div>
  )

  // Mobile swipeable view
  const MobileView = () => (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="map"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) handleSwipe("left")
            }}
            style={{ x, opacity }}
            className="absolute inset-0"
          >
            <div className="h-full w-full relative">
              <AgencyMapOptimized
                agencies={agencies}
                searchLocation={searchCoordinates}
                selectedAgencies={selectedForAnalysis}
                onAgencySelect={handleSelectForAnalysis}
                onStartAnalysis={handleStartAnalysis}
                isLoading={isLoading}
              />
              
              {/* Swipe indicator */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute top-1/2 right-4 -translate-y-1/2"
              >
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                  <span className="text-xs font-medium">Desliza para chat</span>
                  <ChevronRight className="w-4 h-4 animate-pulse" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) handleSwipe("right")
            }}
            style={{ x, opacity }}
            className="absolute inset-0 bg-background"
          >
            <div className="h-full w-full flex flex-col">
              {/* Chat Header */}
              <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <FiMessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">AI Assistant</h2>
                      <p className="text-sm text-muted-foreground">
                        {location} {query && `- ${query}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Swipe indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </div>
              </div>
              
              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                {deviceType === "mobile" ? <ChatPanelMobile /> : <ChatPanel />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <MobileBottomTabs />
    </div>
  )

  // Tablet/Desktop view with resizable panels
  const DesktopView = () => (
    <div className="fixed inset-0 bg-background">
      <PanelGroup
        direction="horizontal"
        className="h-full w-full"
      >
        {/* Map Panel */}
        <Panel
          defaultSize={deviceType === "tablet" ? 50 : 55}
          minSize={30}
          maxSize={80}
          className="relative"
        >
          <div className="h-full w-full">
            <AgencyMapOptimized
              agencies={agencies}
              searchLocation={searchCoordinates}
              selectedAgencies={selectedForAnalysis}
              onAgencySelect={handleSelectForAnalysis}
              onStartAnalysis={handleStartAnalysis}
              isLoading={isLoading}
            />
          </div>
          
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "absolute top-4 right-4 z-10",
              "w-10 h-10 bg-background border rounded-lg",
              "flex items-center justify-center",
              "hover:bg-accent transition-colors",
              "shadow-md"
            )}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="relative w-1 bg-border hover:bg-primary/20 transition-colors group">
          <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2">
            <div className="sticky top-1/2 -translate-y-1/2 flex h-10 w-6 items-center justify-center rounded-md border bg-background shadow-sm group-hover:shadow-md transition-shadow">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel defaultSize={deviceType === "tablet" ? 50 : 45} minSize={20} maxSize={70}>
          <div className="h-full w-full bg-background border-l">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="flex-shrink-0 border-b bg-background">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <FiMessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">AI Assistant</h2>
                      <p className="text-sm text-muted-foreground">
                        {location} {query && `- ${query}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                {deviceType === "mobile" ? <ChatPanelMobile /> : <ChatPanel />}
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>

      <AgencyDetail
        agency={selectedAgency}
        isOpen={!!selectedAgency}
        onClose={() => setSelectedAgency(null)}
        onSelectForAnalysis={(agency) => handleSelectForAnalysis(agency.id)}
        selectedAgencies={selectedForAnalysis}
        maxSelections={3}
      />

      {isLoading && (
        <LoadingScreen
          type={loadingType}
          title={loadingType === "search" ? "Buscando agencias..." : "Analizando agencias..."}
          subtitle={loadingType === "search" ? 
            "Estamos buscando las mejores agencias cerca de ti" : 
            "Realizando análisis detallado de inventario y datos"
          }
        />
      )}
    </div>
  )

  // Main render logic for other steps
  if (currentStep !== "results") {
    return (
      <>
        {currentStep === "analysis" && (
          <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Análisis Detallado</h2>
                <p className="text-muted-foreground">
                  Resultados del análisis de {selectedAgenciesData.length} agencias
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleNewSearch}>
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Nueva búsqueda
                </Button>
                <Button onClick={() => setCurrentStep("chat")}>
                  <FiMessageSquare className="mr-2 h-4 w-4" />
                  Chat con IA
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {selectedAgenciesData.map((agency) => (
                <Card key={agency.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{agency.name}</h3>
                      <p className="text-muted-foreground">{agency.address}</p>
                    </div>
                    <Badge variant={agency.isHighRated ? "default" : "secondary"}>
                      {agency.rating} ⭐
                    </Badge>
                  </div>

                  {agency.analysis && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Resumen del análisis:</h4>
                        <p className="text-muted-foreground">{agency.analysis.summary}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Fortalezas:</h4>
                          <ul className="space-y-1">
                            {agency.analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                • {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Recomendaciones:</h4>
                          <ul className="space-y-1">
                            {agency.analysis.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentStep === "chat" && (
          <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Chat con IA</h2>
                <p className="text-muted-foreground">
                  Pregunta sobre las agencias analizadas
                </p>
              </div>
              <Button variant="outline" onClick={() => setCurrentStep("analysis")}>
                Volver al análisis
              </Button>
            </div>

            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <FiMessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>Función de chat en desarrollo</p>
                <p className="text-sm mt-2">
                  Aquí podrás hacer preguntas específicas sobre las agencias analizadas
                </p>
              </div>
            </Card>
          </div>
        )}
      </>
    )
  }

  // Main results view - responsive based on device
  return (
    <AIAssistantProvider>
      {deviceType === "mobile" ? <MobileView /> : <DesktopView />}
    </AIAssistantProvider>
  )
}