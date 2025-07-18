/**
 * @fileoverview Componente para renderizar texto con citations [1][2]
 * @module components/chat/CitationText
 * 
 * Renderiza texto con citations clickeables, optimizado para móvil
 * con touch targets de 44px mínimo según las guías de accesibilidad.
 */

import React from 'react'
import { cn } from '@/lib/utils'
import type { Citation } from '@/types/citations'

/**
 * Props para CitationText
 */
interface CitationTextProps {
  /** Texto que puede contener citations [1][2] */
  text: string
  
  /** Array de citations disponibles */
  citations?: Citation[]
  
  /** Callback cuando se hace click en una citation */
  onCitationClick?: (index: number) => void
  
  /** Clases CSS adicionales */
  className?: string
}

/**
 * CitationText - Renderiza texto con citations clickeables
 * 
 * Este componente:
 * - Parsea el texto buscando patrones [n]
 * - Renderiza las citations como botones táctiles
 * - Mantiene touch targets de 44px para accesibilidad móvil
 * - Aplica estilos consistentes con el diseño
 * 
 * @example
 * ```tsx
 * <CitationText 
 *   text="Encontré 5 agencias Nissan[1] con buenas reseñas[2]"
 *   citations={sources}
 *   onCitationClick={(index) => openSourcePanel(index)}
 * />
 * ```
 */
export function CitationText({ 
  text, 
  citations = [], 
  onCitationClick,
  className 
}: CitationTextProps) {
  /**
   * Parsea el texto y renderiza las citations
   */
  const renderWithCitations = (text: string) => {
    // Dividir el texto por el patrón de citations [n]
    const parts = text.split(/(\[\d+\])/g)
    
    return parts.map((part, i) => {
      // Verificar si es una citation
      const match = part.match(/\[(\d+)\]/)
      
      if (match) {
        const citationIndex = parseInt(match[1])
        const citation = citations.find((_, idx) => idx + 1 === citationIndex)
        
        return (
          <button
            key={i}
            onClick={() => onCitationClick?.(citationIndex - 1)}
            className={cn(
              // Estilos base
              "inline-flex items-center justify-center",
              "min-w-[44px] min-h-[44px]", // Touch target mínimo
              "px-2 -mx-1", // Padding interno y compensación de margen
              
              // Estilos visuales
              "text-blue-600 dark:text-blue-400",
              "hover:bg-blue-50 dark:hover:bg-blue-950/20",
              "rounded-md transition-colors",
              
              // Estilos de texto
              "text-sm font-medium",
              "align-baseline", // Alineación con el texto
              
              // Estados
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "active:bg-blue-100 dark:active:bg-blue-900/30",
              
              // Cursor
              citation ? "cursor-pointer" : "cursor-default opacity-50"
            )}
            disabled={!citation}
            aria-label={citation ? `Ver fuente ${citationIndex}: ${citation.title}` : `Fuente ${citationIndex} no disponible`}
            title={citation?.title}
          >
            [{citationIndex}]
          </button>
        )
      }
      
      // Si no es una citation, renderizar el texto normal
      return <span key={i}>{part}</span>
    })
  }
  
  return (
    <span className={cn("citation-text", className)}>
      {renderWithCitations(text)}
    </span>
  )
}

/**
 * Hook para extraer citations de un texto
 * 
 * @example
 * const citationIndices = useCitationIndices("Texto con [1] y [2]")
 * // Returns: [1, 2]
 */
export function useCitationIndices(text: string): number[] {
  return React.useMemo(() => {
    const matches = text.match(/\[(\d+)\]/g) || []
    return matches
      .map(match => parseInt(match.slice(1, -1)))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b)
  }, [text])
}