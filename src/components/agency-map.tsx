"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FiMapPin, FiStar, FiPhone, FiClock, FiInfo } from "react-icons/fi"
import type { Agency } from "@/types/agency"

interface AgencyMapProps {
  agencies: Agency[]
  onAgencyClick: (agency: Agency) => void
}

export function AgencyMap({ agencies, onAgencyClick }: AgencyMapProps) {
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)

  const handleMarkerClick = (agency: Agency) => {
    setSelectedAgency(agency)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
          <div className="absolute inset-0 opacity-30">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 150 Q100 100 150 150 Q200 200 250 150 Q300 100 350 150"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                opacity="0.3"
              />
              <path
                d="M0 200 Q100 180 200 200 Q300 220 400 200"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>

        {/* Agency Markers */}
        {agencies.map((agency, index) => (
          <motion.div
            key={agency.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute cursor-pointer"
            style={{
              left: `${20 + (index * 15) % 60}%`,
              top: `${30 + (index * 10) % 40}%`,
            }}
            onClick={() => handleMarkerClick(agency)}
          >
            <div
              className={`
                relative flex items-center justify-center w-12 h-12 rounded-full border-2 
                ${
                  agency.isHighRated
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-yellow-500 border-yellow-600 text-white"
                }
                ${selectedAgency?.id === agency.id ? "ring-4 ring-blue-500" : ""}
                shadow-lg hover:scale-110 transition-transform
              `}
            >
              <span className="text-xs font-bold">
                {agency.rating.toFixed(1)}
              </span>
              <FiStar className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
            </div>
          </motion.div>
        ))}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur">
            <FiMapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Agency Details Card */}
      {selectedAgency && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedAgency.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAgency.address}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedAgency.isHighRated ? "default" : "secondary"}>
                    <FiStar className="h-3 w-3 mr-1" />
                    {selectedAgency.rating}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({selectedAgency.reviewCount} reseñas)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <FiPhone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedAgency.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedAgency.hours}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiMapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedAgency.distance}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedAgency.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>

              {selectedAgency.isHighRated && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <FiInfo className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Agencia destacada
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Esta agencia tiene un rating superior a 4.0 y análisis detallado disponible.
                  </p>
                </div>
              )}

              <Button
                onClick={() => onAgencyClick(selectedAgency)}
                className="w-full"
                disabled={!selectedAgency.isHighRated}
              >
                {selectedAgency.isHighRated ? "Ver análisis detallado" : "Sin análisis disponible"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}