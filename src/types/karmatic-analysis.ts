/**
 * Tipos para el sistema de análisis de confianza Karmatic
 * Interfaces para integrar Core Trust Engine con UI
 */

/**
 * Respuesta del endpoint /api/analyze
 */
export interface AnalysisResponse {
  /** Agencias analizadas con trust scoring */
  agencies: AnalysisResult[]
  
  /** Metadata del análisis realizado */
  metadata: {
    /** Tiempo total de ejecución en milisegundos */
    executionTimeMs: number
    /** Total de agencias encontradas inicialmente */
    totalAgenciesFound: number
    /** Total de agencias procesadas */
    totalProcessed: number
    /** Total de agencias con reviews analizadas */
    totalWithReviews: number
    /** Total de agencias con análisis profundo */
    totalWithDeepAnalysis: number
    /** Errores encontrados durante el análisis */
    errors: string[]
  }
}

/**
 * Resultado del análisis de una agencia individual
 */
export interface AnalysisResult {
  /** Información básica de la agencia */
  agency: AgencyBasicInfo
  
  /** Análisis de confianza */
  trustAnalysis: TrustAnalysis
  
  /** Reviews procesadas */
  reviews: ProcessedReview[]
  
  /** Número total de reviews analizadas */
  reviewsCount: number
  
  /** Distancia desde la ubicación de búsqueda */
  distance: number
  
  /** Análisis profundo (opcional, solo top agencias) */
  deepAnalysis?: DeepAnalysis
  
  /** Timestamp del análisis */
  timestamp: Date
}

/**
 * Información básica de una agencia desde Google Places
 */
export interface AgencyBasicInfo {
  /** Google Place ID */
  placeId: string
  
  /** Nombre de la agencia */
  name: string
  
  /** Dirección completa */
  address: string
  
  /** Número de teléfono */
  phone?: string
  
  /** Rating promedio de Google */
  rating: number
  
  /** Horarios de apertura */
  hours?: string
  
  /** Coordenadas geográficas */
  location: {
    lat: number
    lng: number
  }
  
  /** URLs de fotos */
  photos?: string[]
  
  /** Sitio web */
  website?: string
  
  /** Estado del negocio */
  businessStatus?: string
}

/**
 * Análisis de confianza de una agencia
 */
export interface TrustAnalysis {
  /** Score de confianza (0-100) */
  trustScore: number
  
  /** Nivel de confianza categorizado */
  trustLevel: 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja'
  
  /** Métricas detalladas del análisis */
  metrics: {
    /** Porcentaje de reviews positivas */
    positiveReviewsPercent: number
    /** Cantidad de palabras clave de fraude encontradas */
    fraudKeywordsCount: number
    /** Tasa de respuesta a quejas */
    responseRate: number
    /** Patrón de ratings (natural vs sospechoso) */
    ratingPattern: 'natural' | 'sospechoso'
  }
  
  /** Señales de alerta identificadas */
  redFlags: string[]
  
  /** Señales positivas identificadas */
  greenFlags: string[]
}

/**
 * Review procesada para análisis
 */
export interface ProcessedReview {
  /** ID único de la review */
  id: string
  
  /** Autor de la review */
  author: string
  
  /** Rating de la review (1-5) */
  rating: number
  
  /** Texto de la review */
  text: string
  
  /** Timestamp de la review */
  time: number
  
  /** Descripción relativa del tiempo */
  relativeTimeDescription: string
}

/**
 * Análisis profundo de una agencia (Perplexity/OpenRouter)
 */
export interface DeepAnalysis {
  /** URL del inventario de la agencia */
  inventoryUrl?: string
  
  /** Presencia en redes sociales */
  socialMedia?: {
    /** Página de Facebook */
    facebook?: string
    /** Perfil de Instagram */
    instagram?: string
    /** Sitio web oficial */
    website?: string
  }
  
  /** Noticias recientes o menciones */
  recentNews?: string[]
  
  /** Información adicional encontrada */
  additionalInfo?: string
}

/**
 * Datos para almacenar en base de datos
 */
export interface StoredSearchResult {
  /** ID único de la búsqueda */
  searchId: string
  
  /** Ubicación de la búsqueda */
  location: string
  
  /** Query de búsqueda */
  query: string | null
  
  /** Coordenadas de la búsqueda */
  coordinates?: {
    lat: number
    lng: number
  }
  
  /** Resultados del análisis */
  resultsJson: {
    /** Agencias analizadas */
    agencies: StoredAgencyResult[]
    
    /** Metadata del análisis */
    analysisMetadata?: {
      executionTimeMs: number
      totalAgenciesFound: number
      totalProcessed: number
      totalWithReviews: number
      totalWithDeepAnalysis: number
      errors: string[]
    }
  }
}

/**
 * Agencia almacenada en base de datos
 */
export interface StoredAgencyResult {
  /** Datos básicos de Google Places */
  id: string
  name: string
  rating: number
  userRatingsTotal: number
  address: string
  phoneNumber?: string
  latitude: number
  longitude: number
  website?: string
  openingHours?: string[]
  placeId: string
  
  /** Datos adicionales de Google Places */
  photos?: string[]
  googleMapsUrl?: string
  businessStatus?: string
  
  /** Datos de trust analysis */
  trustScore?: number
  trustLevel?: 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja'
  redFlags?: string[]
  greenFlags?: string[]
  reviewsAnalyzed?: number
  
  /** Análisis profundo */
  deepAnalysis?: DeepAnalysis
  
  /** Reviews procesadas */
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
    relative_time_description: string
  }>
  
  /** Distancia calculada */
  distance?: string
}

/**
 * Parámetros para la función de transformación
 */
export interface TransformationParams {
  /** Respuesta del análisis */
  analysisResponse: AnalysisResponse
  
  /** Coordenadas de la búsqueda */
  searchCoordinates: {
    lat: number
    lng: number
  }
  
  /** Configuración adicional */
  options?: {
    /** Incluir análisis profundo */
    includeDeepAnalysis?: boolean
    /** Máximo de reviews por agencia */
    maxReviewsPerAgency?: number
  }
}

/**
 * Opciones para el renderizado de trust indicators
 */
export interface TrustIndicatorOptions {
  /** Mostrar score numérico */
  showScore?: boolean
  
  /** Mostrar nivel de texto */
  showLevel?: boolean
  
  /** Mostrar como badge */
  variant?: 'badge' | 'full' | 'minimal'
  
  /** Tamaño del indicador */
  size?: 'sm' | 'md' | 'lg'
  
  /** Mostrar tooltip con detalles */
  showTooltip?: boolean
}