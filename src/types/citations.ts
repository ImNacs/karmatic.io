/**
 * @fileoverview Tipos para el sistema de citations estilo Perplexity
 * @module types/citations
 * 
 * Define las estructuras de datos para citar fuentes externas
 * en las respuestas del chat conversacional.
 */

/**
 * Tipos de fuentes que se pueden citar
 */
export type CitationType = 
  | 'google_places'  // Búsquedas en Google Places
  | 'inventory'      // Inventario de agencias
  | 'news'          // Noticias o artículos
  | 'website'       // Sitio web oficial
  | 'reviews'       // Reseñas agregadas
  | 'search'        // Resultado de búsqueda

/**
 * Citation - Representa una fuente externa citada
 * 
 * Solo se citan fuentes EXTERNAS verificables, nunca
 * análisis internos o cálculos propios de Karmatic.
 */
export interface Citation {
  /** ID único de la cita (usado internamente) */
  id: string
  
  /** Número de la cita mostrado al usuario [1], [2], etc. */
  index?: number
  
  /** URL externa de la fuente */
  url: string
  
  /** Título descriptivo de la fuente */
  title: string
  
  /** Tipo de fuente */
  type: CitationType
  
  /** Metadatos adicionales de la fuente */
  metadata?: {
    /** Número de resultados (para búsquedas) */
    resultCount?: number
    
    /** Número de reseñas (para Google Places) */
    reviewCount?: number
    
    /** Rating promedio (para reseñas) */
    averageRating?: number
    
    /** Número de vehículos (para inventarios) */
    vehicleCount?: number
    
    /** Ubicación de la búsqueda */
    location?: string
    
    /** Fecha de la información */
    timestamp?: string
    
    /** Última actualización */
    lastUpdated?: Date
    
    /** Resumen breve del contenido */
    summary?: string
  }
}

/**
 * Respuesta con citations incluidas
 */
export interface ResponseWithCitations<T = any> {
  /** Datos de la respuesta */
  data: T
  
  /** Fuentes citadas */
  _sources?: Citation[]
}