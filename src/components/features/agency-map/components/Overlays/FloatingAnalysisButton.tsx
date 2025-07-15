/**
 * @fileoverview Floating analysis button overlay for agency maps
 * @module components/features/agency-map/components/Overlays/FloatingAnalysisButton
 */

'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { FiTrendingUp } from 'react-icons/fi'

/**
 * Props for FloatingAnalysisButton component
 * @interface FloatingAnalysisButtonProps
 */
interface FloatingAnalysisButtonProps {
  /** Number of selected agencies */
  selectedCount: number
  /** Whether analysis is loading */
  isLoading: boolean
  /** Callback to start analysis */
  onStartAnalysis: () => void
}

/**
 * Floating analysis button that appears when agencies are selected
 * @component
 * @param {FloatingAnalysisButtonProps} props - Component props
 * @returns {JSX.Element | null} Floating button or null if no selections
 * @example
 * ```tsx
 * <FloatingAnalysisButton
 *   selectedCount={2}
 *   isLoading={false}
 *   onStartAnalysis={() => startAnalysis()}
 * />
 * ```
 */
export const FloatingAnalysisButton: React.FC<FloatingAnalysisButtonProps> = ({
  selectedCount,
  isLoading,
  onStartAnalysis
}) => {
  if (selectedCount === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30"
    >
      <Button
        size="lg"
        className="shadow-2xl px-8 py-6 text-base font-semibold group"
        onClick={onStartAnalysis}
        disabled={isLoading || selectedCount === 0}
      >
        <FiTrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        Analizar {selectedCount} {selectedCount === 1 ? 'agencia' : 'agencias'}
      </Button>
    </motion.div>
  )
}