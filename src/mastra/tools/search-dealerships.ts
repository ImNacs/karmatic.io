/**
 * @fileoverview Herramienta para buscar concesionarios de autos con citations
 * @module mastra/tools/search-dealerships
 * 
 * Busca agencias automotrices cercanas usando el pipeline existente
 * y agrega fuentes citables [1][2] para las respuestas.
 */

import { createTool } from '@mastra/core'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { runAnalysisPipeline } from '../../lib/karmatic/data-pipeline'
import type { Citation } from '../../types/citations'
import type { Agency } from '../../types/agency'

/**
 * Schema de entrada para la búsqueda
 */
const inputSchema = z.object({
  /** Query de búsqueda (opcional) */
  query: z.string().optional().describe('Búsqueda específica del usuario (ej: "Nissan", "Toyota Camry")'),
  
  /** Ubicación para buscar */
  location: z.object({
    lat: z.number().describe('Latitud'),
    lng: z.number().describe('Longitud'),
    address: z.string().optional().describe('Dirección en texto')
  }).describe('Ubicación del usuario'),
  
  /** Radio de búsqueda en km */
  radius: z.number().optional().default(10).describe('Radio de búsqueda en kilómetros')
})

/**
 * Schema de salida con agencias y citations
 */
const outputSchema = z.object({
  /** Agencias encontradas */
  dealerships: z.array(z.any()).describe('Lista de agencias encontradas'),
  
  /** Fuentes externas citables */
  _sources: z.array(z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    type: z.string(),
    metadata: z.any().optional()
  })).optional().describe('Fuentes externas citadas')
})

/**
 * Herramienta searchDealerships
 * 
 * Busca concesionarios automotrices cercanos y retorna:
 * - Lista de agencias con análisis de confianza
 * - Citations de Google Places como fuente
 * 
 * @example
 * const result = await searchDealerships({
 *   query: "Nissan",
 *   location: { lat: 19.4326, lng: -99.1332 },
 *   radius: 5
 * })
 */
export const searchDealerships = createTool({
  id: 'search_dealerships',
  name: 'Buscar Concesionarios',
  description: 'Busca concesionarios de autos cercanos con análisis de confianza',
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    console.log('🔍 searchDealerships: Iniciando búsqueda', {
      query: context.query,
      location: context.location
    })
    
    try {
      // Usar el pipeline existente para buscar agencias
      const searchParams = {
        query: context.query || null,
        location: {
          lat: context.location.lat,
          lng: context.location.lng,
          address: context.location.address || ''
        }
      }
      
      // Ejecutar pipeline de análisis
      const analysisResponse = await runAnalysisPipeline(searchParams)
      
      console.log(`✅ searchDealerships: ${analysisResponse.agencies.length} agencias encontradas`)
      
      // Crear citation para Google Places
      const googlePlacesSource: Citation = {
        id: nanoid(),
        url: `https://www.google.com/maps/search/${encodeURIComponent(
          context.query || 'agencias automotrices'
        )}/@${context.location.lat},${context.location.lng},14z`,
        title: `Google Maps - ${context.query || 'Agencias automotrices'}`,
        type: 'google_places',
        metadata: {
          resultCount: analysisResponse.agencies.length,
          location: context.location.address || `${context.location.lat},${context.location.lng}`,
          timestamp: new Date().toISOString()
        }
      }
      
      // Si hay un query específico y es una marca conocida, agregar citation del sitio oficial
      const sources: Citation[] = [googlePlacesSource]
      
      if (context.query) {
        const brandUrls: Record<string, string> = {
          'nissan': 'https://www.nissan.com.mx/encuentra-tu-distribuidor',
          'toyota': 'https://www.toyota.mx/distribuidores',
          'honda': 'https://www.honda.mx/distribuidores',
          'mazda': 'https://www.mazda.mx/distribuidores',
          'ford': 'https://www.ford.com.mx/concesionarios',
          'chevrolet': 'https://www.chevrolet.com.mx/concesionarios',
          'volkswagen': 'https://www.vw.com.mx/es/concesionarios.html'
        }
        
        const queryLower = context.query.toLowerCase()
        const brand = Object.keys(brandUrls).find(b => queryLower.includes(b))
        
        if (brand && brandUrls[brand]) {
          sources.push({
            id: nanoid(),
            url: brandUrls[brand],
            title: `${brand.charAt(0).toUpperCase() + brand.slice(1)} México - Distribuidores Oficiales`,
            type: 'website',
            metadata: {
              timestamp: new Date().toISOString()
            }
          })
        }
      }
      
      return {
        dealerships: analysisResponse.agencies,
        _sources: sources
      }
      
    } catch (error) {
      console.error('❌ searchDealerships: Error en búsqueda', error)
      throw new Error(`Error al buscar concesionarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
})