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
import { getReviewsSync } from '../../lib/apis/apify-reviews-sync'
import { analyzeTrust } from '../../lib/karmatic/trust-engine'
import type { Citation } from '../../types/citations'
import type { Review } from '../../lib/karmatic/types'

/**
 * Schema de entrada para el análisis
 */
const inputSchema = z.object({
  /** Google Place ID de la agencia */
  placeId: z.string().describe('Google Place ID de la agencia'),
  
  /** Nombre de la agencia para referencias */
  agencyName: z.string().describe('Nombre de la agencia'),
  
  /** Límite de reseñas a analizar */
  limit: z.number().optional().default(150).describe('Número máximo de reseñas a analizar')
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
  name: 'Analizar Reseñas',
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
      const reviewsData = await getReviewsSync(context.placeId, context.limit)
      
      if (!reviewsData.success || !reviewsData.reviews) {
        throw new Error('No se pudieron obtener las reseñas')
      }
      
      console.log(`✅ analyzeReviews: ${reviewsData.reviews.length} reseñas obtenidas`)
      
      // Analizar confianza
      const trustAnalysis = analyzeTrust(reviewsData.reviews, reviewsData.metadata || {})
      
      // Crear citation para Google Places
      const googleReviewsSource: Citation = {
        id: nanoid(),
        url: `https://www.google.com/maps/place/?q=place_id:${context.placeId}`,
        title: `Reseñas de Google - ${context.agencyName}`,
        type: 'reviews',
        metadata: {
          reviewCount: reviewsData.reviews.length,
          averageRating: reviewsData.metadata?.rating || 0,
          lastUpdated: new Date().toISOString()
        }
      }
      
      // Calcular métricas adicionales
      const totalReviews = reviewsData.reviews.length
      const rating = reviewsData.metadata?.rating || 0
      
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