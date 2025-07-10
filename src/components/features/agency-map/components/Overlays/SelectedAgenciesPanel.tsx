'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FiChevronUp, FiX, FiStar, FiTrendingUp } from 'react-icons/fi'
import type { Agency } from '@/types/agency'

interface SelectedAgenciesPanelProps {
  agencies: Agency[]
  selectedAgencies: string[]
  onAgencyDeselect: (agencyId: string) => void
  onComparisonClick: () => void
}

export const SelectedAgenciesPanel: React.FC<SelectedAgenciesPanelProps> = ({
  agencies,
  selectedAgencies,
  onAgencyDeselect,
  onComparisonClick
}) => {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)

  if (selectedAgencies.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-20 pointer-events-auto"
    >
      <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-2xl border-0">
        <div className="p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {selectedAgencies.length} agencias seleccionadas
              </Badge>
            </div>
            <motion.div
              animate={{ rotate: isPanelExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronUp className="w-5 h-5" />
            </motion.div>
          </div>

          <AnimatePresence>
            {isPanelExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {agencies.filter(a => selectedAgencies.includes(a.id)).map((agency) => (
                  <motion.div
                    key={agency.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{agency.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <FiStar className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs">{agency.rating}</span>
                        <span className="text-xs text-muted-foreground">• {agency.distance}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => onAgencyDeselect(agency.id)}
                    >
                      <FiX className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
                
                {selectedAgencies.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={onComparisonClick}
                    >
                      <FiTrendingUp className="w-4 h-4 mr-2" />
                      Comparar agencias
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}