"use client"

import React from 'react'
import { motion } from 'motion/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  FiStar,
  FiUsers,
  FiClock,
  FiMapPin,
  FiPhone,
  FiCheck,
  FiTrendingUp,
  FiAward,
  FiBarChart2
} from 'react-icons/fi'
import type { Agency } from '@/types/agency'

interface AgencyComparisonProps {
  agencies: Agency[]
  isOpen: boolean
  onClose: () => void
  onStartAnalysis: () => void
}

interface ComparisonMetric {
  label: string
  getValue: (agency: Agency) => number | string
  format?: (value: number | string) => string
  higherIsBetter?: boolean
  icon?: React.ReactNode
}

const metrics: ComparisonMetric[] = [
  {
    label: 'Calificación',
    getValue: (a) => a.rating,
    format: (v) => Number(v).toFixed(1),
    higherIsBetter: true,
    icon: <FiStar className="w-4 h-4" />
  },
  {
    label: 'Reseñas',
    getValue: (a) => a.reviewCount,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
    icon: <FiUsers className="w-4 h-4" />
  },
  {
    label: 'Distancia',
    getValue: (a) => parseFloat(a.distance.replace(/[^\d.]/g, '')),
    format: (v) => `${v} km`,
    higherIsBetter: false,
    icon: <FiMapPin className="w-4 h-4" />
  },
  {
    label: 'Especialidades',
    getValue: (a) => a.specialties.length,
    format: (v) => `${v} áreas`,
    higherIsBetter: true,
    icon: <FiAward className="w-4 h-4" />
  }
]

export function AgencyComparison({ agencies, isOpen, onClose, onStartAnalysis }: AgencyComparisonProps) {
  if (agencies.length === 0) return null

  // Calculate best values for each metric
  const bestValues = metrics.reduce((acc, metric) => {
    const values = agencies.map(a => Number(metric.getValue(a)))
    acc[metric.label] = metric.higherIsBetter 
      ? Math.max(...values)
      : Math.min(...values)
    return acc
  }, {} as Record<string, number>)

  const getRelativeScore = (value: number, metric: ComparisonMetric) => {
    const best = bestValues[metric.label]
    if (metric.higherIsBetter) {
      return (value / best) * 100
    } else {
      return (best / value) * 100
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Comparación de Agencias</DialogTitle>
          <DialogDescription>
            Análisis comparativo de las {agencies.length} agencias seleccionadas
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto max-h-[70vh] space-y-6 py-4">
          {/* Agency Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agencies.map((agency, index) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{agency.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="ml-1 font-medium">{agency.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{agency.reviewCount} reseñas</span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground line-clamp-1">{agency.address}</span>
                  </div>
                  {agency.phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{agency.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{agency.hours}</span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1">
                  {agency.specialties.slice(0, 3).map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {agency.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agency.specialties.length - 3}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Metrics Comparison */}
          <div className="space-y-4" data-testid="comparison-metrics">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5" />
              Métricas Comparativas
            </h4>
            
            <div className="space-y-6" data-testid="comparison-chart">
              {metrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {metric.icon}
                    <span className="font-medium">{metric.label}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {agencies.map((agency) => {
                      const value = Number(metric.getValue(agency))
                      const score = getRelativeScore(value, metric)
                      const isBest = value === bestValues[metric.label]
                      
                      return (
                        <div key={agency.id} className="flex items-center gap-3">
                          <div className="w-32 truncate text-sm">
                            {agency.name}
                          </div>
                          <div className="flex-1">
                            <Progress 
                              value={score} 
                              className={cn(
                                "h-2",
                                isBest && "bg-green-100 dark:bg-green-900/20"
                              )}
                            />
                          </div>
                          <div className="w-20 text-right">
                            <span className={cn(
                              "text-sm font-medium",
                              isBest && "text-green-600 dark:text-green-400"
                            )}>
                              {metric.format ? metric.format(value) : value}
                            </span>
                          </div>
                          {isBest && (
                            <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-lg">Resumen de Comparación</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Mejor calificada:</p>
                <p className="text-sm text-muted-foreground">
                  {agencies.reduce((best, agency) => 
                    agency.rating > best.rating ? agency : best
                  ).name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Más cercana:</p>
                <p className="text-sm text-muted-foreground">
                  {agencies.reduce((closest, agency) => 
                    parseFloat(agency.distance) < parseFloat(closest.distance) ? agency : closest
                  ).name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Más reseñas:</p>
                <p className="text-sm text-muted-foreground">
                  {agencies.reduce((most, agency) => 
                    agency.reviewCount > most.reviewCount ? agency : most
                  ).name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Más especialidades:</p>
                <p className="text-sm text-muted-foreground">
                  {agencies.reduce((most, agency) => 
                    agency.specialties.length > most.specialties.length ? agency : most
                  ).name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {agencies.length} agencias seleccionadas para análisis
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={onStartAnalysis} className="gap-2">
              <FiTrendingUp className="w-4 h-4" />
              Iniciar Análisis Detallado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}