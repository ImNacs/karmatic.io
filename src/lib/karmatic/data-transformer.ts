/**
 * Transformador de datos para Core Trust Engine
 * Convierte respuestas del análisis a formatos compatibles con UI
 */

import type { Agency } from '@/types/agency'
import type { 
  AnalysisResponse, 
  AnalysisResult, 
  TransformationParams,
  StoredSearchResult,
  StoredAgencyResult 
} from '@/types/karmatic-analysis'

/**
 * Convierte AnalysisResponse a formato para almacenar en BD
 * @param analysisResponse - Respuesta del endpoint /api/analyze
 * @param searchQuery - Query de búsqueda del usuario
 * @param searchLocation - Ubicación de búsqueda
 * @returns Datos estructurados para almacenar en BD
 */
export function transformAnalysisResponseToStoredFormat(
  analysisResponse: AnalysisResponse,
  _searchQuery: string | null,
  _searchLocation: string
): StoredSearchResult['resultsJson'] {
  return {
    agencies: analysisResponse.agencies.map(result => ({
      // Datos básicos de Google Places
      id: result.agency.placeId,
      name: result.agency.name,
      rating: result.agency.rating,
      userRatingsTotal: result.reviewsCount,
      address: result.agency.address,
      phoneNumber: result.agency.phone,
      latitude: result.agency.location.lat,
      longitude: result.agency.location.lng,
      website: result.agency.website,
      openingHours: result.agency.hours ? [result.agency.hours] : undefined,
      placeId: result.agency.placeId,
      businessStatus: result.agency.businessStatus,
      
      // Datos de trust analysis
      trustScore: result.trustAnalysis.trustScore,
      trustLevel: result.trustAnalysis.trustLevel,
      redFlags: result.trustAnalysis.redFlags,
      greenFlags: result.trustAnalysis.greenFlags,
      reviewsAnalyzed: result.reviewsCount,
      
      // Análisis profundo
      deepAnalysis: result.deepAnalysis,
      
      // Reviews procesadas
      reviews: result.reviews.map(review => ({
        author_name: review.author,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relativeTimeDescription
      })),
      
      // Distancia calculada
      distance: `${result.distance.toFixed(1)} km`
    })),
    
    // Metadata del análisis
    analysisMetadata: analysisResponse.metadata
  }
}

/**
 * Convierte datos almacenados en BD a formato Agency para UI
 * @param storedAgency - Datos de agencia desde BD
 * @returns Objeto Agency para componentes UI
 */
export function transformStoredDataToAgency(storedAgency: StoredAgencyResult): Agency {
  return {
    // Datos básicos
    id: storedAgency.id,
    name: storedAgency.name,
    rating: storedAgency.rating || 0,
    reviewCount: storedAgency.userRatingsTotal || 0,
    address: storedAgency.address,
    phone: storedAgency.phoneNumber || '',
    hours: storedAgency.openingHours?.[0] || 'No disponible',
    distance: storedAgency.distance || '',
    coordinates: { 
      lat: storedAgency.latitude, 
      lng: storedAgency.longitude 
    },
    isHighRated: (storedAgency.rating || 0) >= 4.0,
    specialties: extractSpecialties(storedAgency),
    website: storedAgency.website,
    description: generateDescription(storedAgency),
    images: storedAgency.photos || [],
    
    // Reviews transformadas
    recentReviews: storedAgency.reviews?.slice(0, 3).map((review: any, index: number) => ({
      id: review.time?.toString() || `review-${storedAgency.id}-${index}`,
      author: review.author_name,
      rating: review.rating,
      comment: review.text,
      date: review.relative_time_description
    })) || [],
    
    // Datos adicionales
    placeId: storedAgency.placeId,
    openingHours: storedAgency.openingHours,
    googleMapsUrl: storedAgency.googleMapsUrl,
    businessStatus: storedAgency.businessStatus,
    
    // Trust analysis data
    trustScore: storedAgency.trustScore,
    trustLevel: storedAgency.trustLevel,
    redFlags: storedAgency.redFlags,
    greenFlags: storedAgency.greenFlags,
    reviewsAnalyzed: storedAgency.reviewsAnalyzed,
    deepAnalysis: storedAgency.deepAnalysis,
    
    // Análisis generado basado en trust data
    analysis: generateAnalysisFromTrustData(storedAgency)
  }
}

/**
 * Convierte AnalysisResponse directamente a Array de Agency
 * Para casos donde no se necesita almacenar en BD
 * @param params - Parámetros de transformación
 * @returns Array de Agency para UI
 */
export function transformAnalysisToAgency(params: TransformationParams): Agency[] {
  const { analysisResponse, options = {} } = params
  
  return analysisResponse.agencies.map(result => ({
    // Datos básicos
    id: result.agency.placeId,
    name: result.agency.name,
    rating: result.agency.rating,
    reviewCount: result.reviewsCount,
    address: result.agency.address,
    phone: result.agency.phone || '',
    hours: result.agency.hours || 'No disponible',
    distance: `${result.distance.toFixed(1)} km`,
    coordinates: result.agency.location,
    isHighRated: result.agency.rating >= 4.5,
    specialties: [],
    website: result.agency.website,
    description: '',
    images: result.agency.photos || [],
    
    // Reviews limitadas según opciones
    recentReviews: result.reviews
      .slice(0, options.maxReviewsPerAgency || 3)
      .map(review => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        comment: review.text,
        date: review.relativeTimeDescription
      })),
    
    // Datos adicionales
    placeId: result.agency.placeId,
    openingHours: result.agency.hours ? [result.agency.hours] : undefined,
    businessStatus: result.agency.businessStatus,
    
    // Trust analysis data
    trustScore: result.trustAnalysis.trustScore,
    trustLevel: result.trustAnalysis.trustLevel,
    redFlags: result.trustAnalysis.redFlags,
    greenFlags: result.trustAnalysis.greenFlags,
    reviewsAnalyzed: result.reviewsCount,
    
    // Análisis profundo (opcional)
    deepAnalysis: options.includeDeepAnalysis ? result.deepAnalysis : undefined,
    
    // Análisis generado
    analysis: {
      summary: generateSummary(result),
      strengths: result.trustAnalysis.greenFlags.slice(0, 3),
      recommendations: generateRecommendations(result)
    }
  }))
}

/**
 * Ordena agencias por score de confianza
 * @param agencies - Array de agencias
 * @returns Array ordenado por trust score (descendente)
 */
export function sortAgenciesByTrust(agencies: Agency[]): Agency[] {
  return agencies.sort((a, b) => {
    const scoreA = a.trustScore || 0
    const scoreB = b.trustScore || 0
    return scoreB - scoreA
  })
}

/**
 * Filtra agencias por nivel de confianza mínimo
 * @param agencies - Array de agencias
 * @param minTrustLevel - Nivel mínimo de confianza
 * @returns Array filtrado
 */
export function filterAgenciesByTrustLevel(
  agencies: Agency[],
  minTrustLevel: 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja'
): Agency[] {
  const trustLevelOrder = ['muy_baja', 'baja', 'media', 'alta', 'muy_alta']
  const minIndex = trustLevelOrder.indexOf(minTrustLevel)
  
  return agencies.filter(agency => {
    if (!agency.trustLevel) return false
    const agencyIndex = trustLevelOrder.indexOf(agency.trustLevel)
    return agencyIndex >= minIndex
  })
}

/**
 * Extrae especialidades de una agencia basado en análisis
 * @param storedAgency - Datos de agencia almacenados
 * @returns Array de especialidades
 */
function extractSpecialties(storedAgency: StoredAgencyResult): string[] {
  const specialties: string[] = []
  
  // Extraer de green flags
  if (storedAgency.greenFlags) {
    storedAgency.greenFlags.forEach((flag: string) => {
      if (flag.includes('BMW')) specialties.push('BMW')
      if (flag.includes('Mercedes')) specialties.push('Mercedes-Benz')
      if (flag.includes('Audi')) specialties.push('Audi')
      if (flag.includes('premium')) specialties.push('Autos Premium')
      if (flag.includes('usados')) specialties.push('Autos Usados')
      if (flag.includes('financiamiento')) specialties.push('Financiamiento')
    })
  }
  
  // Fallback basado en rating
  if (specialties.length === 0) {
    if (storedAgency.rating >= 4.5) {
      specialties.push('Servicio Premium')
    }
    if (storedAgency.userRatingsTotal > 100) {
      specialties.push('Amplia Experiencia')
    }
  }
  
  return [...new Set(specialties)] // Remover duplicados
}

/**
 * Genera descripción basada en datos de trust analysis
 * @param storedAgency - Datos de agencia almacenados
 * @returns Descripción generada
 */
function generateDescription(storedAgency: StoredAgencyResult): string {
  const { trustLevel, greenFlags } = storedAgency
  
  if (!trustLevel) return ''
  
  let description = ''
  
  switch (trustLevel) {
    case 'muy_alta':
      description = 'Agencia altamente confiable con excelente reputación'
      break
    case 'alta':
      description = 'Agencia confiable con buena trayectoria'
      break
    case 'media':
      description = 'Agencia con reputación moderada'
      break
    case 'baja':
      description = 'Agencia con algunas señales de precaución'
      break
    case 'muy_baja':
      description = 'Agencia con múltiples señales de alerta'
      break
  }
  
  // Añadir información específica si hay green flags
  if (greenFlags && greenFlags.length > 0) {
    description += `. Destacan por: ${greenFlags.slice(0, 2).join(', ')}`
  }
  
  return description
}

/**
 * Genera análisis basado en datos de trust scoring
 * @param storedAgency - Datos de agencia almacenados
 * @returns Objeto de análisis
 */
function generateAnalysisFromTrustData(storedAgency: StoredAgencyResult): Agency['analysis'] {
  const { trustScore, trustLevel, greenFlags, redFlags } = storedAgency
  
  if (!trustScore) return undefined
  
  return {
    summary: generateSummary({
      trustAnalysis: { trustScore, trustLevel, greenFlags, redFlags },
      agency: { name: storedAgency.name }
    } as any),
    strengths: greenFlags || [],
    recommendations: generateRecommendations({
      trustAnalysis: { trustScore, trustLevel, redFlags }
    } as any)
  }
}

/**
 * Genera resumen basado en análisis de confianza
 * @param result - Resultado del análisis
 * @returns Resumen generado
 */
function generateSummary(result: AnalysisResult): string {
  const { trustScore, trustLevel, greenFlags } = result.trustAnalysis
  const agencyName = result.agency.name
  
  let summary = `${agencyName} `
  
  switch (trustLevel) {
    case 'muy_alta':
      summary += 'es una agencia altamente confiable con excelente reputación'
      break
    case 'alta':
      summary += 'es una agencia confiable con buena trayectoria'
      break
    case 'media':
      summary += 'presenta una reputación moderada'
      break
    case 'baja':
      summary += 'requiere precaución debido a algunas señales de alerta'
      break
    case 'muy_baja':
      summary += 'presenta múltiples señales de alerta'
      break
  }
  
  summary += ` (Score: ${trustScore}/100)`
  
  if (greenFlags && greenFlags.length > 0) {
    summary += `. Destacan por: ${greenFlags.slice(0, 2).join(', ')}`
  }
  
  return summary
}

/**
 * Genera recomendaciones basadas en análisis de confianza
 * @param result - Resultado del análisis
 * @returns Array de recomendaciones
 */
function generateRecommendations(result: AnalysisResult): string[] {
  const { trustLevel, redFlags } = result.trustAnalysis
  const recommendations: string[] = []
  
  // Recomendaciones basadas en trust level
  if (trustLevel === 'muy_alta' || trustLevel === 'alta') {
    recommendations.push('Proceder con confianza')
    recommendations.push('Solicitar cotización detallada')
    recommendations.push('Verificar garantías disponibles')
  } else if (trustLevel === 'media') {
    recommendations.push('Solicitar referencias adicionales')
    recommendations.push('Verificar documentos cuidadosamente')
    recommendations.push('Comparar con otras opciones')
  } else {
    recommendations.push('Proceder con extrema precaución')
    recommendations.push('Verificar todas las condiciones')
    recommendations.push('Considerar otras alternativas')
  }
  
  // Recomendaciones específicas basadas en red flags
  if (redFlags && redFlags.length > 0) {
    if (redFlags.some(flag => flag.includes('precio'))) {
      recommendations.push('Verificar precios con múltiples fuentes')
    }
    if (redFlags.some(flag => flag.includes('documento'))) {
      recommendations.push('Revisar documentación legal minuciosamente')
    }
    if (redFlags.some(flag => flag.includes('servicio'))) {
      recommendations.push('Solicitar testimonios recientes')
    }
  }
  
  return recommendations.slice(0, 3) // Limitar a 3 recomendaciones
}

/**
 * Valida compatibilidad con datos existentes en BD
 * @param storedData - Datos almacenados existentes
 * @returns Datos con fallbacks apropiados
 */
export function validateAndNormalizeStoredData(storedData: Partial<StoredAgencyResult>): StoredAgencyResult {
  return {
    // Campos obligatorios con fallbacks
    id: storedData.id || '',
    name: storedData.name || '',
    rating: storedData.rating || 0,
    userRatingsTotal: storedData.userRatingsTotal || 0,
    address: storedData.address || '',
    latitude: storedData.latitude || 0,
    longitude: storedData.longitude || 0,
    placeId: storedData.placeId || '',
    
    // Campos opcionales
    phoneNumber: storedData.phoneNumber,
    website: storedData.website,
    openingHours: storedData.openingHours,
    photos: storedData.photos,
    googleMapsUrl: storedData.googleMapsUrl,
    businessStatus: storedData.businessStatus,
    
    // Fallbacks para datos de trust analysis
    trustScore: storedData.trustScore,
    trustLevel: storedData.trustLevel,
    redFlags: storedData.redFlags ?? [],
    greenFlags: storedData.greenFlags ?? [],
    reviewsAnalyzed: storedData.reviewsAnalyzed ?? 0,
    deepAnalysis: storedData.deepAnalysis,
    
    // Asegurar que reviews existe
    reviews: storedData.reviews ?? [],
    
    // Distancia calculada
    distance: storedData.distance
  }
}