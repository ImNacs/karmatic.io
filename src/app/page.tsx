"use client"

import { useState } from "react"
import { VerticalSidebar } from "@/components/features/sidebar"
import { SearchInterface } from "@/components/features/search"
import { AgencyMapOptimized } from "@/components/features/agency-map"
import { AgencyDetail } from "@/components/features/agency-detail"
import { LoadingScreen } from "@/components/loading-screen"
import { RegistrationModal } from "@/components/registration-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FiMessageSquare, FiRefreshCw } from "react-icons/fi"
import type { Agency, SearchData } from "@/types/agency"
import { n8nApi } from "@/lib/n8n-api"
import { useGooglePlaces } from "@/lib/google-places"
import { useSearchLimit } from "@/hooks/use-search-limit"
import { useUser } from "@clerk/nextjs"
import { trackEvent } from "@/lib/gtm/gtm"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"search" | "results" | "analysis" | "chat">("search")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<"search" | "analysis">("search")
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<string[]>([])
  const [searchCoordinates, setSearchCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingSearchData, setPendingSearchData] = useState<SearchData | null>(null)
  
  const { getPlaceDetails } = useGooglePlaces()
  const { canSearch, isAuthenticated, refreshLimit } = useSearchLimit()
  const { isSignedIn } = useUser()

  // Mock data for demonstration
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
    },
    {
      id: "3",
      name: "Autos Económicos",
      rating: 3.8,
      reviewCount: 89,
      address: "Eje Central 789, Col. Doctores",
      phone: "+52 55 5555 1234",
      hours: "Lun-Sab 8:00-17:00",
      distance: "4.2 km",
      coordinates: { lat: 19.4200, lng: -99.1450 },
      isHighRated: false,
      specialties: ["Autos Económicos", "Refacciones"],
      description: "Venta de vehículos económicos y refacciones.",
      images: ["/api/placeholder/400/300"],
      recentReviews: [
        {
          id: "4",
          author: "Pedro Martínez",
          rating: 3,
          comment: "Precios bajos pero servicio regular.",
          date: "5 días"
        }
      ]
    }
  ]

  const handleSearch = async (data: SearchData) => {
    // Check if user can search (limit check)
    if (!canSearch && !isAuthenticated) {
      // Store the search data for after registration
      setPendingSearchData(data)
      setShowRegistrationModal(true)
      
      // Track that search was blocked
      trackEvent.searchBlocked(data.location, data.query)
      return
    }
    
    // setSearchData(data) // Not used after refactor
    setIsLoading(true)
    setLoadingType("search")
    
    try {
      // If anonymous user, increment their search count
      if (!isAuthenticated) {
        try {
          const response = await fetch('/api/search/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              location: data.location,
              query: data.query 
            })
          })
          
          if (response.ok) {
            // Refresh the limit after tracking
            await refreshLimit()
          }
        } catch (error) {
          console.error('Error tracking search:', error)
          // Continue with search even if tracking fails
        }
      }
      
      let coordinates: { lat: number; lng: number } | undefined = undefined
      
      // First check if coordinates were provided directly (from geolocation)
      if (data.coordinates) {
        coordinates = data.coordinates
        setSearchCoordinates(coordinates)
      }
      // Otherwise, get place details if placeId is available
      else if (data.placeId) {
        try {
          const placeDetails = await getPlaceDetails(data.placeId)
          if (placeDetails.geometry?.location) {
            coordinates = {
              lat: placeDetails.geometry.location.lat(),
              lng: placeDetails.geometry.location.lng()
            }
            setSearchCoordinates(coordinates)
          }
        } catch (error) {
          console.error('Error getting place details:', error)
          // Continue without coordinates
        }
      }
      
      // Check if n8n API is configured
      if (!n8nApi.isConfigured()) {
        console.warn("N8N API not configured, using mock data")
        // Fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 2000))
        setAgencies(mockAgencies)
        setCurrentStep("results")
        toast.info(`Modo demo: Mostrando ${mockAgencies.length} agencias de ejemplo`)
      } else {
        // Log the data being sent to n8n for debugging
        console.log('Sending to n8n:', {
          location: data.location,
          query: data.query || '',
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          placeId: data.placeId,
          placeDetails: data.placeDetails,
        })
        
        // Call n8n API with all available information
        const response = await n8nApi.searchAgencies({
          location: data.location,
          query: data.query || '',
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          placeId: data.placeId,
          placeDetails: data.placeDetails,
        })

        if (response.success && response.agencies.length > 0) {
          // Transform n8n agencies to match our Agency interface
          const transformedAgencies: Agency[] = response.agencies.map(agency => ({
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
            specialties: [], // Not provided by n8n
            website: agency.website,
            description: '', // Not provided by n8n
            images: [], // Not provided by n8n
            recentReviews: agency.reviews?.slice(0, 3).map((review, index) => ({
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

          setAgencies(transformedAgencies)
          setCurrentStep("results")
          toast.success(`Encontradas ${transformedAgencies.length} agencias en ${data.location}`)
        } else if (!response.success) {
          throw new Error(response.error || 'Error al buscar agencias')
        } else {
          // No agencies found
          setAgencies([])
          setCurrentStep("results")
          toast.info('No se encontraron agencias en esta ubicación')
        }
      }
    } catch (error) {
      console.error('Error searching agencies:', error)
      toast.error(error instanceof Error ? error.message : 'Error al buscar agencias')
      
      // Fallback to mock data on error
      setAgencies(mockAgencies)
      setCurrentStep("results")
    } finally {
      setIsLoading(false)
    }
  }

  // const handleAgencyClick = (agency: Agency) => {
  //   setSelectedAgency(agency)
  // }

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
    
    // Simulate deep analysis
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    setCurrentStep("analysis")
    setIsLoading(false)
    
    toast.success("Análisis completado")
  }

  const handleNewSearch = () => {
    setCurrentStep("search")
    setAgencies([])
    setSelectedAgency(null)
    setSelectedForAnalysis([])
    // setSearchData(null) // Not used after refactor
    setSearchCoordinates(null)
  }

  const selectedAgenciesData = agencies.filter(agency => selectedForAnalysis.includes(agency.id))

  return (
    <div className="min-h-screen bg-background">
      <VerticalSidebar 
        onOpenSearch={handleNewSearch}
        userTokens={150}
      />
      
      <main className="lg:ml-64 container mx-auto px-4 py-8">
        {currentStep === "search" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <SearchInterface 
              onSearch={handleSearch} 
              isLoading={isLoading}
            />
          </div>
        )}

        {currentStep === "results" && (
          <div className="fixed inset-0 lg:left-64 bg-background">
            <AgencyMapOptimized
              agencies={agencies}
              searchLocation={searchCoordinates || undefined}
              selectedAgencies={selectedForAnalysis}
              onAgencySelect={handleSelectForAnalysis}
              onStartAnalysis={handleStartAnalysis}
              isLoading={isLoading}
            />
          </div>
        )}


        {currentStep === "analysis" && (
          <div className="space-y-6">
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
          <div className="space-y-6">
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
      </main>

      <AgencyDetail
        agency={selectedAgency}
        isOpen={!!selectedAgency}
        onClose={() => setSelectedAgency(null)}
        onSelectForAnalysis={(agency) => handleSelectForAnalysis(agency.id)}
        selectedAgencies={selectedForAnalysis}
        maxSelections={3}
      />

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false)
          setPendingSearchData(null)
        }}
        searchData={pendingSearchData ? {
          location: pendingSearchData.location,
          query: pendingSearchData.query
        } : undefined}
        trigger="search_limit"
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
}
