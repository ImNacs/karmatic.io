"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AgencyMapOptimized } from "@/components/features/agency-map"
import { AgencyDetail } from "@/components/features/agency-detail"
import { LoadingScreen } from "@/components/common/loading-screen"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FiMessageSquare, FiRefreshCw } from "react-icons/fi"
import type { Agency } from "@/types/agency"

interface ExplorerResultsProps {
  searchId: string
  location: string
  query: string | null
  agencies: any[]
  searchCoordinates?: { lat: number; lng: number }
  isAuthenticated: boolean
}

export default function ExplorerResults({
  searchId,
  location,
  query,
  agencies: initialAgencies,
  searchCoordinates,
  isAuthenticated
}: ExplorerResultsProps) {
  const [currentStep, setCurrentStep] = useState<"results" | "analysis" | "chat">("results")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<"search" | "analysis">("search")
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<string[]>([])
  
  const router = useRouter()

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
    : mockAgencies // Use mock data if no results

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

  return (
    <>
      {currentStep === "results" && (
        <div className="fixed inset-0 bg-background">
          <AgencyMapOptimized
              agencies={agencies}
              searchLocation={searchCoordinates}
              selectedAgencies={selectedForAnalysis}
              onAgencySelect={handleSelectForAnalysis}
              onStartAnalysis={handleStartAnalysis}
              isLoading={isLoading}
          />
        </div>
      )}

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
    </>
  )
}