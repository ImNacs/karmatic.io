/**
 * Configuración operacional del sistema Karmatic
 * 
 * IMPORTANTE: Este archivo contiene configuración OPERACIONAL
 * Para criterios de FILTRADO y VALIDACIÓN, ver filtering-criteria.json
 */

export const ANALYSIS_CONFIG = {
  // ============================================
  // 1. CONFIGURACIÓN DE APIs EXTERNAS
  // ============================================
  
  // 📍 Google Places API (Nearby Search)
  search: {
    radiusMeters: 5000,                    // Radio de búsqueda por defecto
    language: 'es-MX'                      // Idioma de resultados
  },
  
  // 🔍 Filtros para validación de agencias (pre-análisis)
  agencyFilters: {
    minRating: Number(process.env.AGENCY_MIN_RATING) || 4.0,           // Rating mínimo requerido
    minReviews: Number(process.env.AGENCY_MIN_REVIEWS) || 50,          // Mínimo de reseñas totales
    minMonthlyReviews: Number(process.env.AGENCY_MIN_MONTHLY_REVIEWS) || 5, // Mínimo de reseñas mensuales promedio
    requirePhone: process.env.AGENCY_REQUIRE_PHONE !== 'false',        // Debe tener teléfono
    requireWebsite: process.env.AGENCY_REQUIRE_WEBSITE !== 'false',    // Debe tener sitio web
    // Dominios bloqueados (clasificados, redes sociales, directorios)
    blockedDomains: [
      // Clasificados
      'mercadolibre.com', 'mercadolibre.com.mx',
      'segundamano.mx', 'segundamano.com',
      'vivanuncios.com', 'vivanuncios.com.mx',
      'olx.com', 'olx.com.mx',
      'seminuevos.com',
      // Redes sociales
      'facebook.com', 'fb.com',
      'instagram.com',
      'twitter.com', 'x.com',
      'tiktok.com',
      'youtube.com',
      // Directorios y agregadores
      'yelp.com', 'yelp.com.mx',
      'foursquare.com',
      'tripadvisor.com', 'tripadvisor.com.mx',
      'google.com', 'google.com.mx',
      // Acortadores y páginas genéricas
      'linktr.ee', 'linktree.com',
      'bit.ly', 'tinyurl.com',
      'carrd.co'
    ]
  },
  
  // 📝 Configuración para análisis de reseñas
  reviewAnalysis: {
    // Período de análisis - Opciones: '3 months', '6 months', '1 year', '2 years', '5 years', 'all'
    startDate: process.env.REVIEW_ANALYSIS_START_DATE || '1 year',      
    // Orden de reseñas - Opciones: 'newest', 'mostRelevant', 'highestRanking', 'lowestRanking'
    sort: (process.env.REVIEW_ANALYSIS_SORT || 'newest') as 'newest' | 'mostRelevant' | 'highestRanking' | 'lowestRanking',                                            
    maxPerAgency: Number(process.env.REVIEW_ANALYSIS_MAX) || 100,       // Límite por agencia
    fallbackToBasic: true                                               // Usar Google básico si falla Apify
  },
  
  // 🤖 Perplexity/OpenRouter API
  deepAnalysis: {
    enabled: true,                         // Activar análisis con IA
    defaultModel: 'kimi-k2',               // Modelo: 'sonar-pro', 'sonar', 'kimi-k2'
    onlyForTopAgencies: true,              // Solo para las mejores agencias
    topAgenciesToAnalyze: 3                // Cuántas analizar
  },
  
  // ============================================
  // 2. CONFIGURACIÓN DE PROCESAMIENTO
  // ============================================
  
  // 🏢 Pipeline de procesamiento
  pipeline: {
    maxAgencies: 10,                       // Máximo de agencias a procesar
    timeoutMs: 180000,                     // Timeout total (3 minutos)
    batchSize: 3,                          // Procesar de a 3 para no saturar
    batchDelayMs: 1000,                    // Delay entre batches
    minRating: 4.0                         // Rating mínimo para procesar
  },
  
  // 🚀 Optimizaciones
  optimizations: {
    enableCache: true,                     // Cachear resultados
    cacheDurationMinutes: 60,              // Duración del cache
    parallelProcessing: true,              // Procesamiento paralelo
    compressResponses: false               // Comprimir respuestas JSON
  },
  
  // ============================================
  // 3. CONFIGURACIÓN DE VALIDACIÓN DE AGENCIAS
  // ============================================
  
  // 🔍 Validación de agencias automotrices con IA
  agencyValidation: {
    enabled: process.env.AGENCY_VALIDATION_ENABLED !== 'false',         // Activar validación
    reviewsToAnalyze: Number(process.env.AGENCY_VALIDATION_REVIEWS) || 15,  // Reseñas para validar
    minReviewsRequired: 5,                                              // Mínimo para análisis confiable
    model: 'deepseek-chat',                                            // Modelo de IA para validación
    confidenceThreshold: 70                                            // Confianza mínima requerida
  },
  
  // ============================================
  // 4. CONFIGURACIÓN DE ANÁLISIS
  // ============================================
  
  // ⚖️ Trust Engine
  trustEngine: {
    // Pesos para cálculo del score
    weights: {
      positiveReviews: 0.3,                // 30% del score
      fraudKeywords: 0.3,                  // 30% del score
      responseRate: 0.2,                   // 20% del score
      ratingPattern: 0.2                   // 20% del score
    },
    
    // Niveles de confianza
    trustLevels: {
      muy_alta: 80,
      alta: 60,
      media: 40,
      baja: 20,
      muy_baja: 0
    },
    
    minReviewsForAnalysis: 5               // Mínimo para análisis confiable
  },
  
  // ============================================
  // 5. CONFIGURACIÓN DE COSTOS
  // ============================================
  
  // 💰 Control de costos
  costs: {
    trackCosts: true,                      // Monitorear costos
    maxCostPerQuery: 0.50,                 // Límite por búsqueda (USD)
    
    // Costos por modelo (por millón de tokens)
    modelCosts: {
      'sonar-pro': 0.003,
      'sonar': 0.001,
      'kimi-k2': 0.002
    }
  }
};

// Exportar configuraciones individuales para compatibilidad
export const SEARCH_CONFIG = ANALYSIS_CONFIG.search;
export const AGENCY_FILTERS = ANALYSIS_CONFIG.agencyFilters;
export const REVIEW_ANALYSIS_CONFIG = ANALYSIS_CONFIG.reviewAnalysis;
export const AGENCY_VALIDATION_CONFIG = ANALYSIS_CONFIG.agencyValidation;
export const PIPELINE_CONFIG = ANALYSIS_CONFIG.pipeline;
export const DEEP_ANALYSIS_CONFIG = ANALYSIS_CONFIG.deepAnalysis;
export const TRUST_ENGINE_CONFIG = ANALYSIS_CONFIG.trustEngine;