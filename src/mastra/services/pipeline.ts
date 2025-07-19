/**
 * Pipeline de datos para orquestar todas las APIs
 * Combina Google Places, Apify Reviews y Trust Analysis
 * Versión simplificada para MVP - Fase 1
 */

import { ParsedQuery, Agency, Location, AnalysisResult } from '../types';
import { searchAgencies } from './google-places';
import { getRelevantReviewsForValidation, getReviewsSync } from './apify-reviews-sync';
import { analyzeTrust, analyzeTrustWithMetrics, ReviewMetrics } from './trust-engine';
import { analyzeAgencyDeep } from './perplexity';
import { ANALYSIS_CONFIG, SEARCH_CONFIG, REVIEW_ANALYSIS_CONFIG, AGENCY_VALIDATION_CONFIG, AGENCY_FILTERS } from '../config/analysis.config';
import { EnhancedAgencyValidator } from './enhanced-validator';

// Cache de validación
const validationCache = new Map<string, { isValid: boolean; confidence: number; timestamp: number }>();

// Usar configuración centralizada
const PIPELINE_CONFIG = {
  maxAgencies: ANALYSIS_CONFIG.pipeline.maxAgencies,
  timeoutMs: ANALYSIS_CONFIG.pipeline.timeoutMs,
  reviewsConfig: {
    fallbackToBasic: REVIEW_ANALYSIS_CONFIG.fallbackToBasic
  },
  deepAnalysisConfig: {
    enabled: ANALYSIS_CONFIG.deepAnalysis.enabled,
    onlyForTopAgencies: ANALYSIS_CONFIG.deepAnalysis.onlyForTopAgencies,
    topAgenciesToAnalyze: ANALYSIS_CONFIG.deepAnalysis.topAgenciesToAnalyze
  }
};

/**
 * Interfaz para el resultado del pipeline
 */
export interface PipelineResult {
  agencies: AnalysisResult[];
  metadata: {
    totalAgenciesFound: number;
    totalProcessed: number;
    totalWithReviews: number;
    totalWithDeepAnalysis: number;
    executionTimeMs: number;
    errors: string[];
    totalValidated?: number;
    totalExcluded?: number;
    totalExcludedByLowActivity?: number;
    excludedBusinesses?: {
      name: string;
      reason: string;
    }[];
    avgKarmaScore?: number;
    avgReviewsPerMonth?: number;
  };
}

/**
 * Ejecuta el pipeline completo para una consulta
 */
export async function runAnalysisPipeline(
  query: ParsedQuery,
  userLocation: Location
): Promise<PipelineResult> {
  
  const startTime = Date.now();
  const errors: string[] = [];
  
  // Inicializar validador mejorado
  const enhancedValidator = new EnhancedAgencyValidator();
  
  console.log('🚀 Iniciando pipeline de análisis:', {
    query: query.originalQuery,
    location: userLocation,
    config: PIPELINE_CONFIG
  });
  
  try {
    // Paso 1: Buscar agencias cercanas con Google Places
    console.log('📍 Paso 1: Buscando agencias cercanas...');
    
    let nearbyAgencies: Agency[] = [];
    const currentRadius = SEARCH_CONFIG.radiusMeters;
    
    // Buscar con API de Google Places (Text Search)
    nearbyAgencies = await searchAgencies(
      userLocation,
      query.originalQuery,
      currentRadius
    );
    
    if (nearbyAgencies.length === 0) {
      throw new Error('No se encontraron agencias automotrices cercanas');
    }
    
    console.log(`✅ Encontradas ${nearbyAgencies.length} agencias cercanas`);
    
    // Paso 2: FASE 1 - Validación rápida con reseñas relevantes
    console.log('🔍 FASE 1: Validando negocios automotrices...');
    const validatedAgencies: Agency[] = [];
    const invalidAgencies: { agency: Agency; reason: string }[] = [];
    
    // Validar cada agencia
    for (const agency of nearbyAgencies) {
      // Aplicar filtro de rating primero
      if (!agency.rating || agency.rating < ANALYSIS_CONFIG.pipeline.minRating) {
        console.log(`⚠️ ${agency.name} - Rating bajo: ${agency.rating || 'N/A'}`);
        continue;
      }
      
      // FASE 1: Validación con reseñas relevantes
      if (AGENCY_VALIDATION_CONFIG.enabled) {
        const validationResult = await validateAgency(agency, enhancedValidator);
        
        if (validationResult.isValid && 
            validationResult.confidence >= AGENCY_VALIDATION_CONFIG.confidenceThreshold) {
          validatedAgencies.push(agency);
          console.log(`✅ ${agency.name} - Validado (confianza: ${validationResult.confidence}%): ${validationResult.reason}`);
        } else {
          invalidAgencies.push({ agency, reason: validationResult.reason });
          console.log(`❌ ${agency.name} - No automotriz (confianza: ${validationResult.confidence}%): ${validationResult.reason}`);
        }
      } else {
        // Si la validación está deshabilitada, incluir todas
        validatedAgencies.push(agency);
      }
      
      // Limitar al máximo configurado
      if (validatedAgencies.length >= PIPELINE_CONFIG.maxAgencies) {
        break;
      }
    }
    
    console.log(`✅ FASE 1 completada: ${validatedAgencies.length} agencias validadas de ${nearbyAgencies.length}`);
    if (invalidAgencies.length > 0) {
      console.log(`⚠️ Se excluyeron ${invalidAgencies.length} negocios no automotrices`);
    }
    
    // Paso 3: FASE 2 - Análisis completo de agencias validadas
    console.log('📊 FASE 2: Analizando agencias validadas...');
    const results: AnalysisResult[] = [];
    let excludedByLowActivity = 0;
    const batchSize = ANALYSIS_CONFIG.pipeline.batchSize;
    
    for (let i = 0; i < validatedAgencies.length; i += batchSize) {
      const batch = validatedAgencies.slice(i, i + batchSize);
      
      const batchPromises = batch.map(agency => 
        analyzeValidAgency(agency, userLocation, errors).catch(error => {
          errors.push(`Error analizando ${agency.name}: ${error.message}`);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Agregar resultados válidos
      batchResults.forEach(result => {
        if (result) {
          results.push(result);
        } else {
          // Si el resultado es null, puede ser por baja actividad
          const errorMsg = errors[errors.length - 1];
          if (errorMsg && errorMsg.includes('reseñas/mes')) {
            excludedByLowActivity++;
          }
        }
      });
      
      console.log(`✅ Procesado batch ${Math.ceil((i + batchSize) / batchSize)} de ${Math.ceil(validatedAgencies.length / batchSize)}`);
    }
    
    // Validación: Si no hay resultados exitosos, incluir agencias sin análisis completo
    if (results.length === 0 && validatedAgencies.length > 0) {
      console.warn('⚠️ Ninguna agencia procesada exitosamente. Incluyendo datos básicos...');
      
      // Incluir al menos las primeras 3 agencias con datos básicos
      const basicResults = validatedAgencies.slice(0, 3).map(agency => {
        const basicResult: AnalysisResult = {
          agency,
          trustAnalysis: {
            trustScore: 50, // Score neutral por defecto
            trustLevel: 'media' as const,
            metrics: {
              positiveReviewsPercent: 0,
              fraudKeywordsCount: 0,
              responseRate: 0,
              ratingPattern: 'natural' as const
            },
            redFlags: ['Sin análisis completo disponible'],
            greenFlags: []
          },
          reviews: [],
          reviewsCount: 0,
          distance: calculateDistance(
            agency.location.lat,
            agency.location.lng,
            userLocation.lat || 19.4326,
            userLocation.lng || -99.1332
          ),
          deepAnalysis: undefined,
          timestamp: new Date()
        };
        
        return basicResult;
      });
      
      results.push(...basicResults);
      errors.push('Análisis completo no disponible. Mostrando datos básicos.');
    }
    
    // Paso 4: Ordenar resultados por trust score
    const sortedResults = results.sort((a, b) => b.trustAnalysis.trustScore - a.trustAnalysis.trustScore);
    
    // Paso 5: Análisis profundo para top agencias (si está habilitado)
    if (PIPELINE_CONFIG.deepAnalysisConfig.enabled && sortedResults.length > 0) {
      await addDeepAnalysisToTopAgencies(sortedResults, errors);
    }
    
    const executionTime = Date.now() - startTime;
    
    // Calcular métricas agregadas
    const avgKarmaScore = results.length > 0
      ? results
          .filter(r => r.reviewMetrics?.karmaScore !== null)
          .map(r => r.reviewMetrics!.karmaScore!)
          .reduce((sum, score, _, arr) => sum + score / arr.length, 0)
      : null;
      
    const avgReviewsPerMonth = results.length > 0
      ? results
          .filter(r => r.reviewMetrics?.avgReviewsPerMonth !== null)
          .map(r => r.reviewMetrics!.avgReviewsPerMonth!)
          .reduce((sum, avg, _, arr) => sum + avg / arr.length, 0)
      : null;
    
    console.log(`🎯 Pipeline completado en ${executionTime}ms:`, {
      totalAgenciesFound: nearbyAgencies.length,
      totalProcessed: results.length,
      totalWithReviews: results.filter(r => r.reviewsCount > 0).length,
      totalWithDeepAnalysis: results.filter(r => r.deepAnalysis).length,
      topTrustScore: sortedResults[0]?.trustAnalysis.trustScore || 0,
      avgKarmaScore: avgKarmaScore?.toFixed(1),
      excludedByLowActivity,
      errors: errors.length
    });
    
    return {
      agencies: sortedResults,
      metadata: {
        totalAgenciesFound: nearbyAgencies.length,
        totalProcessed: results.length,
        totalWithReviews: results.filter(r => r.reviewsCount > 0).length,
        totalWithDeepAnalysis: results.filter(r => r.deepAnalysis).length,
        executionTimeMs: executionTime,
        errors,
        totalValidated: validatedAgencies.length,
        totalExcluded: invalidAgencies.length,
        totalExcludedByLowActivity: excludedByLowActivity,
        excludedBusinesses: invalidAgencies.slice(0, 5).map(item => ({
          name: item.agency.name,
          reason: item.reason
        })),
        avgKarmaScore: avgKarmaScore ? parseFloat(avgKarmaScore.toFixed(1)) : undefined,
        avgReviewsPerMonth: avgReviewsPerMonth ? parseFloat(avgReviewsPerMonth.toFixed(1)) : undefined
      }
    };
    
  } catch (error) {
    console.error('❌ Error en pipeline:', error);
    throw error;
  }
}

/**
 * Procesa una agencia individual: reviews + trust analysis
 */
// La función processAgency fue reemplazada por validateAgency y analyzeValidAgency

/**
 * Agregar análisis profundo a las top agencias
 */
async function addDeepAnalysisToTopAgencies(results: AnalysisResult[], errors: string[]): Promise<void> {
  console.log('🔎 Agregando análisis profundo a top agencias...');
  
  const topAgencies = results
    .filter(r => r.trustAnalysis.trustScore >= 60) // Score mínimo para análisis profundo
    .slice(0, ANALYSIS_CONFIG.deepAnalysis.topAgenciesToAnalyze);
  
  if (topAgencies.length === 0) {
    console.log('⚠️  No hay agencias que califiquen para análisis profundo');
    return;
  }
  
  console.log(`🎯 Analizando profundamente ${topAgencies.length} agencias top`);
  
  // Procesar análisis profundo en paralelo
  const deepAnalysisPromises = topAgencies.map(async (result) => {
    try {
      const deepAnalysis = await analyzeAgencyDeep(
        result.agency.name,
        result.agency.address,
        result.agency.placeId
      );
      
      result.deepAnalysis = deepAnalysis;
      
      console.log(`🔍 Análisis profundo completado para ${result.agency.name}`);
      
    } catch (error) {
      console.error(`❌ Error en análisis profundo de ${result.agency.name}:`, error);
      errors.push(`Análisis profundo falló para ${result.agency.name}`);
    }
  });
  
  await Promise.all(deepAnalysisPromises);
  
  console.log('✅ Análisis profundo completado');
}

/**
 * Calcula la distancia entre dos coordenadas usando fórmula de Haversine
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
}

/**
 * FASE 1: Validar si una agencia es automotriz usando reseñas relevantes
 */
async function validateAgency(
  agency: Agency, 
  enhancedValidator: EnhancedAgencyValidator
): Promise<{ isValid: boolean; confidence: number; reason: string }> {
  const cacheKey = agency.placeId;
  
  // Verificar caché primero
  const cached = validationCache.get(cacheKey);
  if (cached) {
    const cacheAge = Date.now() - cached.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    if (cacheAge < maxAge) {
      console.log(`📋 Usando validación en caché para ${agency.name}`);
      return { isValid: cached.isValid, confidence: cached.confidence, reason: 'Desde caché' };
    }
  }
  
  try {
    // Obtener reseñas más relevantes para validación
    const validationReviews = await getRelevantReviewsForValidation(
      agency.placeId,
      AGENCY_VALIDATION_CONFIG.reviewsToAnalyze
    );
    
    if (validationReviews.length === 0) {
      console.log(`⚠️ Sin reseñas para validar ${agency.name}`);
      return { isValid: true, confidence: 50, reason: 'Sin reseñas disponibles' };
    }
    
    // Validar con enhanced validator
    const result = await enhancedValidator.validateAgency(agency, validationReviews);
    
    // Guardar en caché
    validationCache.set(cacheKey, {
      isValid: result.isValid,
      confidence: result.confidence,
      timestamp: Date.now()
    });
    
    return {
      isValid: result.isValid,
      confidence: result.confidence,
      reason: result.reason
    };
    
  } catch (error) {
    console.error(`❌ Error validando ${agency.name}:`, error);
    // En caso de error, dar beneficio de la duda con baja confianza
    return { isValid: true, confidence: 30, reason: 'Error en validación' };
  }
}

/**
 * FASE 2: Analizar agencia validada con todas las reseñas
 */
async function analyzeValidAgency(
  agency: Agency,
  userLocation: Location,
  errors: string[]
): Promise<AnalysisResult | null> {
  console.log(`📊 Analizando agencia validada: ${agency.name}`);
  
  try {
    // Obtener reseñas completas usando la configuración
    const reviews = await getReviewsSync(
      agency.placeId,
      REVIEW_ANALYSIS_CONFIG.startDate,
      REVIEW_ANALYSIS_CONFIG.sort,
      REVIEW_ANALYSIS_CONFIG.maxPerAgency
    );
    
    console.log(`📝 Obtenidas ${reviews.length} reseñas para análisis completo`);
    
    // Filtrar reviews inválidas
    const validReviews = reviews.filter(review => {
      return review && typeof review.rating === 'number' && 
             review.rating >= 0 && review.rating <= 5;
    });
    
    // Análisis de confianza con métricas extendidas
    const { trustAnalysis, reviewMetrics } = analyzeTrustWithMetrics(validReviews);
    
    // NUEVO FILTRO: Verificar promedio mensual de reseñas
    if (reviewMetrics.avgReviewsPerMonth !== null && 
        reviewMetrics.avgReviewsPerMonth < AGENCY_FILTERS.minMonthlyReviews) {
      console.log(`❌ ${agency.name} - Filtrada por baja actividad: ${reviewMetrics.avgReviewsPerMonth.toFixed(1)} reseñas/mes (mínimo: ${AGENCY_FILTERS.minMonthlyReviews})`);
      errors.push(`${agency.name} excluida: solo ${reviewMetrics.avgReviewsPerMonth.toFixed(1)} reseñas/mes`);
      return null; // Excluir esta agencia
    }
    
    // Calcular distancia
    const distance = calculateDistance(
      agency.location.lat,
      agency.location.lng,
      userLocation.lat || 19.4326,
      userLocation.lng || -99.1332
    );
    
    const result: AnalysisResult = {
      agency,
      trustAnalysis,
      reviews: validReviews,
      reviewsCount: validReviews.length,
      distance,
      reviewMetrics: {
        karmaScore: reviewMetrics.karmaScoreSample,
        reviewFrequency: reviewMetrics.reviewFrequencySample,
        avgReviewsPerMonth: reviewMetrics.avgReviewsPerMonth,
        daysSinceLastReview: reviewMetrics.daysSinceLastReview
      },
      deepAnalysis: undefined,
      timestamp: new Date()
    };
    
    console.log(`✅ ${agency.name} analizada: ${trustAnalysis.trustScore}/100 (${trustAnalysis.trustLevel}) - ${reviewMetrics.avgReviewsPerMonth?.toFixed(1) || 'N/A'} reseñas/mes`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error analizando ${agency.name}:`, error);
    errors.push(`Error analizando ${agency.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Función de utilidad para obtener un resumen rápido del pipeline
 */
export function getPipelineSummary(result: PipelineResult): string {
  const { agencies, metadata } = result;
  
  if (agencies.length === 0) {
    return 'No se encontraron agencias que cumplan con los criterios de confianza.';
  }
  
  const topAgency = agencies[0];
  const avgTrustScore = Math.round(
    agencies.reduce((sum, agency) => sum + agency.trustAnalysis.trustScore, 0) / agencies.length
  );
  
  return `Se analizaron ${metadata.totalProcessed} agencias en ${metadata.executionTimeMs}ms. ` +
         `Mejor opción: ${topAgency.agency.name} (${topAgency.trustAnalysis.trustScore}/100). ` +
         `Promedio de confianza: ${avgTrustScore}/100. ` +
         `${metadata.totalWithReviews} agencias con reviews completas.`;
}

/**
 * Función para obtener estadísticas del pipeline
 */
export function getPipelineStats(result: PipelineResult): {
  trustDistribution: { [key: string]: number };
  averageReviewsPerAgency: number;
  topRedFlags: string[];
  topGreenFlags: string[];
} {
  const { agencies } = result;
  
  // Distribución de niveles de confianza
  const trustDistribution: { [key: string]: number } = {};
  agencies.forEach(agency => {
    const level = agency.trustAnalysis.trustLevel;
    trustDistribution[level] = (trustDistribution[level] || 0) + 1;
  });
  
  // Promedio de reviews por agencia
  const averageReviewsPerAgency = agencies.length > 0 
    ? Math.round(agencies.reduce((sum, agency) => sum + agency.reviewsCount, 0) / agencies.length)
    : 0;
  
  // Top red flags más comunes
  const allRedFlags: string[] = [];
  agencies.forEach(agency => {
    allRedFlags.push(...agency.trustAnalysis.redFlags);
  });
  
  const redFlagCounts: { [key: string]: number } = {};
  allRedFlags.forEach(flag => {
    redFlagCounts[flag] = (redFlagCounts[flag] || 0) + 1;
  });
  
  const topRedFlags = Object.entries(redFlagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([flag]) => flag);
  
  // Top green flags más comunes
  const allGreenFlags: string[] = [];
  agencies.forEach(agency => {
    allGreenFlags.push(...agency.trustAnalysis.greenFlags);
  });
  
  const greenFlagCounts: { [key: string]: number } = {};
  allGreenFlags.forEach(flag => {
    greenFlagCounts[flag] = (greenFlagCounts[flag] || 0) + 1;
  });
  
  const topGreenFlags = Object.entries(greenFlagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([flag]) => flag);
  
  return {
    trustDistribution,
    averageReviewsPerAgency,
    topRedFlags,
    topGreenFlags
  };
}