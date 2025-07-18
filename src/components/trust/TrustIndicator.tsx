/**
 * Componente para mostrar indicadores de confianza
 * Muestra trust score y nivel de confianza con iconos y colores
 */

"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { FiShield, FiAlertTriangle, FiCheck, FiX } from "react-icons/fi"
import type { TrustIndicatorOptions } from "@/types/karmatic-analysis"

interface TrustIndicatorProps {
  trustScore?: number
  trustLevel?: 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja'
  redFlags?: string[]
  greenFlags?: string[]
  options?: TrustIndicatorOptions
  className?: string
}

/**
 * Configuración visual para cada nivel de confianza
 */
const TRUST_LEVEL_CONFIG = {
  muy_alta: {
    label: 'Muy Alta',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: FiShield,
    description: 'Agencia altamente confiable'
  },
  alta: {
    label: 'Alta',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: FiCheck,
    description: 'Agencia confiable'
  },
  media: {
    label: 'Media',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: FiAlertTriangle,
    description: 'Agencia con reputación moderada'
  },
  baja: {
    label: 'Baja',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: FiAlertTriangle,
    description: 'Agencia con algunas señales de precaución'
  },
  muy_baja: {
    label: 'Muy Baja',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: FiX,
    description: 'Agencia con múltiples señales de alerta'
  }
} as const

/**
 * Obtiene el color basado en el trust score numérico
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-green-600'
  if (score >= 40) return 'text-yellow-600'
  if (score >= 20) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Componente principal TrustIndicator
 */
export function TrustIndicator({
  trustScore,
  trustLevel,
  redFlags = [],
  greenFlags = [],
  options = {},
  className
}: TrustIndicatorProps) {
  const {
    showScore = true,
    showLevel = true,
    variant = 'full',
    size = 'md',
    showTooltip = true
  } = options

  // Si no hay datos de trust, no mostrar nada
  if (!trustScore && !trustLevel) {
    return null
  }

  const levelConfig = trustLevel ? TRUST_LEVEL_CONFIG[trustLevel] : null
  const scoreColor = trustScore ? getScoreColor(trustScore) : 'text-gray-500'

  // Contenido principal del indicador
  const IndicatorContent = () => {
    if (variant === 'minimal') {
      return (
        <div className={cn("flex items-center gap-2", className)}>
          {trustScore && showScore && (
            <span className={cn("font-semibold", scoreColor, {
              'text-xs': size === 'sm',
              'text-sm': size === 'md',
              'text-base': size === 'lg'
            })}>
              {trustScore}
            </span>
          )}
          {levelConfig && (
            <levelConfig.icon className={cn("w-4 h-4", levelConfig.textColor)} />
          )}
        </div>
      )
    }

    if (variant === 'badge') {
      return (
        <Badge
          variant="secondary"
          className={cn(
            "flex items-center gap-1",
            levelConfig?.bgColor,
            levelConfig?.textColor,
            levelConfig?.borderColor,
            className
          )}
        >
          {levelConfig && <levelConfig.icon className="w-3 h-3" />}
          {showLevel && levelConfig && (
            <span className={cn({
              'text-xs': size === 'sm',
              'text-sm': size === 'md',
              'text-base': size === 'lg'
            })}>
              {levelConfig.label}
            </span>
          )}
          {showScore && trustScore && (
            <span className={cn("font-semibold", {
              'text-xs': size === 'sm',
              'text-sm': size === 'md',
              'text-base': size === 'lg'
            })}>
              {trustScore}
            </span>
          )}
        </Badge>
      )
    }

    // Variant 'full' - más detallado
    return (
      <Card className={cn(
        "p-3 border-l-4",
        levelConfig?.borderColor,
        levelConfig?.bgColor,
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {levelConfig && (
              <levelConfig.icon className={cn("w-5 h-5", levelConfig.textColor)} />
            )}
            <div>
              {showLevel && levelConfig && (
                <p className={cn("font-semibold", levelConfig.textColor, {
                  'text-sm': size === 'sm',
                  'text-base': size === 'md',
                  'text-lg': size === 'lg'
                })}>
                  Confianza {levelConfig.label}
                </p>
              )}
              {showScore && trustScore && (
                <p className={cn("text-sm", scoreColor)}>
                  Score: {trustScore}/100
                </p>
              )}
            </div>
          </div>
          
          {/* Indicadores de flags */}
          <div className="flex items-center gap-2">
            {greenFlags.length > 0 && (
              <div className="flex items-center gap-1">
                <FiCheck className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  {greenFlags.length}
                </span>
              </div>
            )}
            {redFlags.length > 0 && (
              <div className="flex items-center gap-1">
                <FiX className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-700 font-medium">
                  {redFlags.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Contenido del tooltip
  const TooltipContent_Custom = () => (
    <div className="max-w-xs space-y-2">
      {levelConfig && (
        <div>
          <p className="font-semibold">{levelConfig.description}</p>
          {trustScore && (
            <p className="text-sm">Score de confianza: {trustScore}/100</p>
          )}
        </div>
      )}
      
      {greenFlags.length > 0 && (
        <div>
          <p className="font-medium text-green-700 text-sm">
            ✓ Señales positivas ({greenFlags.length}):
          </p>
          <ul className="text-xs space-y-1">
            {greenFlags.slice(0, 3).map((flag, index) => (
              <li key={index} className="text-green-600">• {flag}</li>
            ))}
            {greenFlags.length > 3 && (
              <li className="text-green-600">• Y {greenFlags.length - 3} más...</li>
            )}
          </ul>
        </div>
      )}
      
      {redFlags.length > 0 && (
        <div>
          <p className="font-medium text-red-700 text-sm">
            ⚠ Señales de alerta ({redFlags.length}):
          </p>
          <ul className="text-xs space-y-1">
            {redFlags.slice(0, 3).map((flag, index) => (
              <li key={index} className="text-red-600">• {flag}</li>
            ))}
            {redFlags.length > 3 && (
              <li className="text-red-600">• Y {redFlags.length - 3} más...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )

  // Renderizado con o sin tooltip
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <IndicatorContent />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <TooltipContent_Custom />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <IndicatorContent />
}

/**
 * Componente simplificado para mostrar solo el badge de confianza
 */
export function TrustBadge({
  trustScore,
  trustLevel,
  className
}: Pick<TrustIndicatorProps, 'trustScore' | 'trustLevel' | 'className'>) {
  return (
    <TrustIndicator
      trustScore={trustScore}
      trustLevel={trustLevel}
      className={className}
      options={{
        variant: 'badge',
        size: 'sm',
        showScore: false,
        showLevel: true,
        showTooltip: false
      }}
    />
  )
}

/**
 * Componente para mostrar solo el score numérico
 */
export function TrustScore({
  trustScore,
  className
}: Pick<TrustIndicatorProps, 'trustScore' | 'className'>) {
  if (!trustScore) return null

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <FiShield className={cn("w-4 h-4", getScoreColor(trustScore))} />
      <span className={cn("font-semibold", getScoreColor(trustScore))}>
        {trustScore}
      </span>
    </div>
  )
}