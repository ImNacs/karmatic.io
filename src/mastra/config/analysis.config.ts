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
  
  // 📝 Apify Reviews API
  reviews: {
    reviewsPeriod: '1 year',               // Período para análisis completo
    reviewsSort: 'newest' as const,        // Orden para análisis completo
    maxReviewsPerAgency: 100,              // Límite por agencia (configurable en JSON)
    fallbackToBasic: true                  // Usar Google básico si falla Apify
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
  // 3. CONFIGURACIÓN DE VALIDACIÓN (RESPALDO)
  // ============================================
  
  // 🔍 Validación con agente IA
  validation: {
    enabled: true,
    reviewsToAnalyze: 15,                  // Máximo de reseñas a analizar
    minReviewsForAnalysis: 5,              // Mínimo de reseñas para análisis confiable
    validationModel: 'deepseek-chat',      // Modelo para validación binaria
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
export const PIPELINE_CONFIG = ANALYSIS_CONFIG.pipeline;
export const REVIEWS_CONFIG = ANALYSIS_CONFIG.reviews;
export const DEEP_ANALYSIS_CONFIG = ANALYSIS_CONFIG.deepAnalysis;
export const TRUST_ENGINE_CONFIG = ANALYSIS_CONFIG.trustEngine;