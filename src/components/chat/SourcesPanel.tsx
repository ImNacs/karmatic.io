/**
 * @fileoverview Panel de fuentes como bottom sheet para móvil
 * @module components/chat/SourcesPanel
 * 
 * Muestra las fuentes citadas en un panel deslizable desde abajo,
 * optimizado para interacción táctil en dispositivos móviles.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, MapPin, Star, FileText, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Citation } from '@/types/citations'

/**
 * Props para SourcesPanel
 */
interface SourcesPanelProps {
  /** Fuentes a mostrar */
  sources: Citation[]
  
  /** Si el panel está abierto */
  isOpen: boolean
  
  /** Callback para cerrar el panel */
  onClose: () => void
  
  /** Clases CSS adicionales */
  className?: string
}

/**
 * Obtener icono según el tipo de fuente
 */
function getSourceIcon(type: Citation['type']) {
  switch (type) {
    case 'google_places':
      return MapPin
    case 'reviews':
      return Star
    case 'inventory':
      return FileText
    case 'website':
    case 'news':
    case 'search':
    default:
      return Globe
  }
}

/**
 * Formatear la fecha relativa
 */
function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days < 30) return `Hace ${days} día${days > 1 ? 's' : ''}`
  
  return date.toLocaleDateString('es-MX')
}

/**
 * SourcesPanel - Panel de fuentes como bottom sheet
 * 
 * Este componente:
 * - Se desliza desde abajo en móvil
 * - Muestra todas las fuentes citadas
 * - Permite abrir enlaces externos
 * - Incluye gesture para cerrar
 * 
 * @example
 * ```tsx
 * <SourcesPanel
 *   sources={citations}
 *   isOpen={showSources}
 *   onClose={() => setShowSources(false)}
 * />
 * ```
 */
export function SourcesPanel({ 
  sources, 
  isOpen, 
  onClose,
  className 
}: SourcesPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Panel deslizable */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              // Cerrar si se arrastra más de 100px hacia abajo
              if (info.offset.y > 100) {
                onClose()
              }
            }}
            className={cn(
              // Posicionamiento
              "fixed bottom-0 left-0 right-0 z-50",
              
              // Dimensiones
              "max-h-[75vh] min-h-[200px]",
              
              // Estilos
              "bg-white dark:bg-gray-900",
              "rounded-t-2xl shadow-2xl",
              
              // Layout
              "flex flex-col",
              
              className
            )}
          >
            {/* Handle para arrastrar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b dark:border-gray-800">
              <h3 className="text-lg font-semibold">Fuentes</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Cerrar panel de fuentes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Lista de fuentes */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {sources.map((source, index) => {
                const Icon = getSourceIcon(source.type)
                
                return (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      // Layout
                      "block p-4",
                      
                      // Estilos
                      "bg-gray-50 dark:bg-gray-800/50",
                      "rounded-lg border border-gray-200 dark:border-gray-700",
                      
                      // Interacción
                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                      "hover:border-gray-300 dark:hover:border-gray-600",
                      "transition-colors",
                      
                      // Touch target
                      "min-h-[60px]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono y número */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          [{index + 1}]
                        </span>
                        <Icon className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {source.title}
                        </h4>
                        
                        {/* Metadatos */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {source.metadata?.resultCount && (
                            <span>{source.metadata.resultCount} resultados</span>
                          )}
                          {source.metadata?.reviewCount && (
                            <span>{source.metadata.reviewCount} reseñas</span>
                          )}
                          {source.metadata?.averageRating && (
                            <span>⭐ {source.metadata.averageRating}</span>
                          )}
                          {source.metadata?.timestamp && (
                            <span>{formatRelativeTime(source.metadata.timestamp)}</span>
                          )}
                        </div>
                        
                        {/* URL */}
                        <div className="flex items-center gap-1 mt-2">
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {new URL(source.url).hostname}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
              
              {sources.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay fuentes disponibles
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}