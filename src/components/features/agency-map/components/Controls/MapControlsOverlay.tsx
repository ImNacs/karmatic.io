'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { FiFilter, FiNavigation } from 'react-icons/fi'

interface MapControlsOverlayProps {
  agencyCount: number
}

export const MapControlsOverlay: React.FC<MapControlsOverlayProps> = ({ agencyCount }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      <div className="flex justify-between items-start">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="pointer-events-auto"
        >
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-3">
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{agencyCount} agencias encontradas</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pointer-events-auto"
        >
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-lg border-0 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiNavigation className="w-4 h-4" />
              <span>Click en los marcadores para más info</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}