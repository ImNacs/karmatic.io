/**
 * @fileoverview Agency information window overlay for maps
 * @module components/features/agency-map/components/Overlays/AgencyInfoWindow
 */

'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrustIndicator } from '@/components/trust'
import { 
  FiStar, 
  FiMapPin, 
  FiPhone, 
  FiGlobe, 
  FiClock,
  FiCheck,
  FiX
} from 'react-icons/fi'
import type { Agency } from '@/types/agency'

/**
 * Props for AgencyInfoWindow component
 * @interface AgencyInfoWindowProps
 */
interface AgencyInfoWindowProps {
  /** Agency data to display */
  agency: Agency
  /** Whether agency is selected for analysis */
  isSelected: boolean
  /** Callback to select agency */
  onSelect: () => void
  /** Callback to close info window */
  onClose: () => void
}

/**
 * Agency information window overlay for map markers
 * @component
 * @param {AgencyInfoWindowProps} props - Component props
 * @returns {JSX.Element} Agency info window with details and actions
 * @example
 * ```tsx
 * <AgencyInfoWindow
 *   agency={selectedAgency}
 *   isSelected={false}
 *   onSelect={() => selectAgency(agency.id)}
 *   onClose={() => setShowInfo(false)}
 * />
 * ```
 */
export const AgencyInfoWindow: React.FC<AgencyInfoWindowProps> = ({ 
  agency, 
  isSelected, 
  onSelect, 
  onClose 
}) => {
  return (
    <Card className="w-80 overflow-hidden shadow-2xl border-0 backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
      <div className="relative p-4">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 w-8 h-8 p-0"
          onClick={onClose}
        >
          <FiX className="w-4 h-4" />
        </Button>
        
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg pr-8">{agency.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="ml-1 text-sm font-medium">{agency.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{agency.distance}</span>
            </div>
            {(agency.trustScore || agency.trustLevel) && (
              <div className="mt-2">
                <TrustIndicator
                  trustScore={agency.trustScore}
                  trustLevel={agency.trustLevel}
                  redFlags={agency.redFlags}
                  greenFlags={agency.greenFlags}
                  options={{
                    variant: 'badge',
                    size: 'sm',
                    showTooltip: true
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <FiMapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{agency.address}</span>
            </div>
            
            {agency.phone && (
              <div className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${agency.phone}`} className="text-primary hover:underline">
                  {agency.phone}
                </a>
              </div>
            )}
            
            {agency.website && (
              <div className="flex items-center gap-2">
                <FiGlobe className="w-4 h-4 text-muted-foreground" />
                <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {agency.website}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <FiClock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{agency.hours}</span>
            </div>
          </div>

          <Button
            className="w-full"
            variant={isSelected ? "secondary" : "default"}
            onClick={onSelect}
          >
            {isSelected ? (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                Seleccionada
              </>
            ) : (
              'Seleccionar para análisis'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}