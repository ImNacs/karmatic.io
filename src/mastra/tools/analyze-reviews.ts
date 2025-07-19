/**
 * @fileoverview Herramienta para analizar reseñas de agencias con citations
 * @module mastra/tools/analyze-reviews
 * 
 * Analiza las reseñas de una agencia específica y retorna
 * el análisis de confianza con fuentes citables.
 */

import { createTool } from '@mastra/core'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { getReviewsSync } from '../services/apify-reviews-sync'
import { analyzeTrust } from '../services/trust-engine'
import { REVIEW_ANALYSIS_CONFIG } from '../config/analysis.config'
import type { Citation } from '../../types/citations'
import type { Review } from '../types'

/**
 * Schema de entrada para el análisis
 */
const inputSchema = z.object({
  /** Google Place ID de la agencia */
  placeId: z.string().describe('Google Place ID de la agencia'),
  
  /** Nombre de la agencia para referencias */
  agencyName: z.string().describe('Nombre de la agencia'),
  
  /** Límite de reseñas a analizar */
  limit: z.number().optional().default(REVIEW_ANALYSIS_CONFIG.maxPerAgency).describe('Número máximo de reseñas a analizar')
})

/**
 * Schema de salida con análisis y citations
 */
const outputSchema = z.object({
  /** Análisis de confianza */
  analysis: z.object({
    trustScore: z.number().describe('Score de confianza 0-100'),
    trustLevel: z.enum(['muy_alta', 'alta', 'media', 'baja', 'muy_baja']),
    totalReviews: z.number(),
    rating: z.number(),
    metrics: z.object({
      positiveReviewsPercent: z.number(),
      fraudKeywordsCount: z.number(),
      responseRate: z.number(),
      ratingPattern: z.enum(['natural', 'sospechoso'])
    }),
    redFlags: z.array(z.string()),
    greenFlags: z.array(z.string())
  }),
  
  /** Fuentes externas citables */
  _sources: z.array(z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    type: z.string(),
    metadata: z.any().optional()
  })).optional()
})

/**
 * Herramienta analyzeReviews
 * 
 * Analiza las reseñas de una agencia para determinar:
 * - Score de confianza basado en patrones
 * - Señales de alerta (red flags)
 * - Señales positivas (green flags)
 * - Métricas detalladas
 * 
 * @example
 * const result = await analyzeReviews({
 *   placeId: "ChIJrTLr7y_65YgRAMx_zz-4h3Q",
 *   agencyName: "AutoMax Polanco"
 * })
 */
export const analyzeReviews = createTool({
  id: 'analyze_reviews',
  description: 'Analiza las reseñas de una agencia para determinar su confianza',
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    console.log('📊 analyzeReviews: Iniciando análisis', {
      placeId: context.placeId,
      agencyName: context.agencyName
    })
    
    try {
      // Obtener reseñas usando Apify
      const reviews = await getReviewsSync(
        context.placeId, 
        REVIEW_ANALYSIS_CONFIG.startDate, 
        REVIEW_ANALYSIS_CONFIG.sort, 
        context.limit
      )
      
      if (!reviews || reviews.length === 0) {
        throw new Error('No se pudieron obtener las reseñas')
      }
      
      console.log(`✅ analyzeReviews: ${reviews.length} reseñas obtenidas`)
      
      // Analizar confianza
      const trustAnalysis = analyzeTrust(reviews)
      
      // Crear citation para Google Places
      const googleReviewsSource: Citation = {
        id: nanoid(),
        url: `https://www.google.com/maps/place/?q=place_id:${context.placeId}`,
        title: `Reseñas de Google - ${context.agencyName}`,
        type: 'reviews',
        metadata: {
          reviewCount: reviews.length,
          averageRating: 0, // No tenemos el rating promedio aquí
          lastUpdated: new Date()
        }
      }
      
      // Calcular métricas adicionales
      const totalReviews = reviews.length
      const rating = 0 // No tenemos el rating promedio aquí
      
      return {
        analysis: {
          trustScore: trustAnalysis.trustScore,
          trustLevel: trustAnalysis.trustLevel,
          totalReviews,
          rating,
          metrics: trustAnalysis.metrics,
          redFlags: trustAnalysis.redFlags,
          greenFlags: trustAnalysis.greenFlags
        },
        _sources: [googleReviewsSource]
      }
      
    } catch (error) {
      console.error('❌ analyzeReviews: Error en análisis', error)
      throw new Error(`Error al analizar reseñas: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
})