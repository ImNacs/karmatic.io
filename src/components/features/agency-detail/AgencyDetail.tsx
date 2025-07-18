/**
 * @fileoverview Detailed agency information modal
 * @module components/features/agency-detail/AgencyDetail
 */

"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrustIndicator } from "@/components/trust"
import { 
  FiStar, 
  FiPhone, 
  FiMapPin, 
  FiClock, 
  FiGlobe, 
  FiAward, 
  FiCheckCircle,
  FiX
} from "react-icons/fi"
import type { Agency } from "@/types/agency"

/**
 * Props for AgencyDetail component
 * @interface AgencyDetailProps
 */
interface AgencyDetailProps {
  /** Agency to display (null when closed) */
  agency: Agency | null
  /** Whether modal is open */
  isOpen: boolean
  /** Callback to close modal */
  onClose: () => void
  /** Callback when agency is selected for analysis */
  onSelectForAnalysis: (agency: Agency) => void
  /** Array of selected agency IDs */
  selectedAgencies: string[]
  /** Maximum number of agencies that can be selected */
  maxSelections: number
}

/**
 * Detailed agency information modal with image gallery and selection
 * @component
 * @param {AgencyDetailProps} props - Component props
 * @returns {JSX.Element | null} Agency detail modal or null if no agency
 * @example
 * ```tsx
 * <AgencyDetail
 *   agency={selectedAgency}
 *   isOpen={showDetail}
 *   onClose={() => setShowDetail(false)}
 *   onSelectForAnalysis={handleAgencySelect}
 *   selectedAgencies={selectedIds}
 *   maxSelections={3}
 * />
 * ```
 */
export function AgencyDetail({ 
  agency, 
  isOpen, 
  onClose, 
  onSelectForAnalysis,
  selectedAgencies,
  maxSelections = 3
}: AgencyDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!agency) return null

  const isSelected = selectedAgencies.includes(agency.id)
  const canSelect = selectedAgencies.length < maxSelections || isSelected

  const handleSelect = () => {
    if (agency) {
      onSelectForAnalysis(agency)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{agency.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <FiX className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <Image
                src={agency.images[currentImageIndex] || "/api/placeholder/400/300"}
                alt={agency.name}
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            {agency.images.length > 1 && (
              <div className="flex space-x-2 mt-2">
                {agency.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{agency.name}</h2>
              <p className="text-muted-foreground mt-1">{agency.address}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <FiStar className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{agency.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({agency.reviewCount} reseñas)
                  </span>
                </div>
                <Badge variant={agency.isHighRated ? "default" : "secondary"}>
                  <FiAward className="h-3 w-3 mr-1" />
                  {agency.isHighRated ? "Destacada" : "Estándar"}
                </Badge>
              </div>
              {(agency.trustScore || agency.trustLevel) && (
                <div className="mt-3">
                  <TrustIndicator
                    trustScore={agency.trustScore}
                    trustLevel={agency.trustLevel}
                    redFlags={agency.redFlags}
                    greenFlags={agency.greenFlags}
                    options={{
                      variant: 'full',
                      size: 'md',
                      showTooltip: true
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <FiPhone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.hours}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiMapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.distance}</span>
                </div>
                {agency.website && (
                  <div className="flex items-center space-x-2">
                    <FiGlobe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Sitio web
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {agency.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground">{agency.description}</p>
            </div>
          )}

          {/* Specialties */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Especialidades</h3>
            <div className="flex flex-wrap gap-2">
              {agency.specialties.map((specialty, index) => (
                <Badge key={index} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Analysis Preview */}
          {agency.analysis && (
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <FiCheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  Análisis Preliminar
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  {agency.analysis.summary}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Fortalezas:</h4>
                    <ul className="text-sm space-y-1">
                      {agency.analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <FiCheckCircle className="h-3 w-3 text-green-600 mr-1 mt-0.5" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Recomendaciones:</h4>
                    <ul className="text-sm space-y-1">
                      {agency.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <FiStar className="h-3 w-3 text-yellow-600 mr-1 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Reseñas Recientes</h3>
            <div className="space-y-4">
              {agency.recentReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {review.author.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{review.author}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? "text-yellow-500" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selection Button */}
          <div className="sticky bottom-0 bg-background border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {selectedAgencies.length} de {maxSelections} agencias seleccionadas
              </div>
              <div className="flex space-x-1">
                {[...Array(maxSelections)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < selectedAgencies.length ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleSelect}
              disabled={!agency.isHighRated || (!canSelect && !isSelected)}
              className="w-full"
              variant={isSelected ? "destructive" : "default"}
            >
              {!agency.isHighRated ? (
                "Análisis no disponible (Rating < 4.0)"
              ) : isSelected ? (
                "Quitar de análisis"
              ) : !canSelect ? (
                "Máximo 3 agencias seleccionadas"
              ) : (
                "Seleccionar para análisis detallado"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}