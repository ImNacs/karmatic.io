'use client'

import React from 'react'
import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { motion } from 'framer-motion'
import { FiMapPin, FiCheck } from 'react-icons/fi'
import type { Agency } from '@/types/agency'

interface AgencyMarkerProps {
  agency: Agency
  isSelected: boolean
  onClick: () => void
}

export const AgencyMarker: React.FC<AgencyMarkerProps> = ({ agency, isSelected, onClick }) => {
  return (
    <AdvancedMarker 
      position={agency.coordinates}
      onClick={onClick}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer shadow-lg transition-all duration-200
          ${isSelected 
            ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' 
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-xl'}
        `}
      >
        <FiMapPin className="w-5 h-5" />
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AdvancedMarker>
  )
}