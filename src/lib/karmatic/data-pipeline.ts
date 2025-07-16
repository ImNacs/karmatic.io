/**
 * Pipeline de datos para orquestar todas las APIs
 * Combina Google Places, Apify Reviews y Trust Analysis
 * Versión simplificada para MVP - Fase 1
 */

import { ParsedQuery, Agency, Review, TrustAnalysis, Location, AnalysisResult } from './types';
import { searchNearbyAgencies, getAgencyDetails } from '../apis/google-places';
import { getQuickReviewsSync } from '../apis/apify-reviews-sync';
import { analyzeTrust } from './trust-engine';
import { analyzeAgencyDeep } from '../apis/perplexity';

// Configuración del pipeline
const PIPELINE_CONFIG = {
  // Número máximo de agencias a procesar
  maxAgencies: 10,
  
  // Timeout general para todo el pipeline
  timeoutMs: 30000, // 30 segundos
  
  // Configuración de reviews
  reviewsConfig: {
    useQuickReviews: true, // Usar getQuickReviews (50 reviews, 30s timeout)
    fallbackToBasic: true   // Fallback a reviews básicas si Apify falla
  },
  
  // Configuración de análisis profundo
  deepAnalysisConfig: {
    enabled: true,
    onlyForTopAgencies: true, // Solo para las top 3 agencias
    minTrustScore: 10        // Solo si trust score > 10 (para pruebas)
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
  
  console.log('🚀 Iniciando pipeline de análisis:', {
    query: query.originalQuery,
    location: userLocation,
    config: PIPELINE_CONFIG
  });
  
  try {
    // Paso 1: Buscar agencias cercanas con Google Places
    console.log('📍 Paso 1: Buscando agencias cercanas...');
    const nearbyAgencies = await searchNearbyAgencies(
      userLocation,
      5000, // 5km radius
      'auto dealership car dealer'
    );
    
    if (nearbyAgencies.length === 0) {
      throw new Error('No se encontraron agencias automotrices cercanas');
    }
    
    console.log(`✅ Encontradas ${nearbyAgencies.length} agencias cercanas`);
    
    // Paso 2: Filtrar y limitar agencias a procesar
    const agenciesToProcess = nearbyAgencies
      .filter(agency => agency.rating && agency.rating >= 3.0) // Filtro básico de calidad
      .slice(0, PIPELINE_CONFIG.maxAgencies);
    
    console.log(`🔍 Procesando ${agenciesToProcess.length} agencias seleccionadas`);
    
    // Paso 3: Procesar cada agencia en paralelo (con límite de concurrencia)
    const results: AnalysisResult[] = [];
    const batchSize = 3; // Procesar 3 agencias a la vez para evitar sobrecarga
    
    for (let i = 0; i < agenciesToProcess.length; i += batchSize) {
      const batch = agenciesToProcess.slice(i, i + batchSize);
      
      const batchPromises = batch.map(agency => 
        processAgency(agency, errors).catch(error => {
          errors.push(`Error procesando ${agency.name}: ${error.message}`);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Agregar resultados válidos
      batchResults.forEach(result => {
        if (result) {
          results.push(result);
        }
      });
      
      console.log(`✅ Procesado batch ${Math.ceil((i + batchSize) / batchSize)} de ${Math.ceil(agenciesToProcess.length / batchSize)}`);
    }
    
    // Paso 4: Ordenar resultados por trust score
    const sortedResults = results.sort((a, b) => b.trustAnalysis.trustScore - a.trustAnalysis.trustScore);
    
    // Paso 5: Análisis profundo para top agencias (si está habilitado)
    if (PIPELINE_CONFIG.deepAnalysisConfig.enabled) {
      await addDeepAnalysisToTopAgencies(sortedResults, errors);
    }
    
    const executionTime = Date.now() - startTime;
    
    console.log(`🎯 Pipeline completado en ${executionTime}ms:`, {
      totalAgenciesFound: nearbyAgencies.length,
      totalProcessed: results.length,
      totalWithReviews: results.filter(r => r.reviewsCount > 0).length,
      totalWithDeepAnalysis: results.filter(r => r.deepAnalysis).length,
      topTrustScore: sortedResults[0]?.trustAnalysis.trustScore || 0,
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
        errors
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
async function processAgency(agency: Agency, errors: string[]): Promise<AnalysisResult | null> {
  console.log(`🔄 Procesando agencia: ${agency.name}`);
  
  try {
    // Obtener reviews completas de la agencia
    let reviews: Review[] = [];
    
    if (PIPELINE_CONFIG.reviewsConfig.useQuickReviews) {
      try {
        reviews = await getQuickReviewsSync(agency.placeId);
        console.log(`📝 Obtenidas ${reviews.length} reviews de ${agency.name}`);
      } catch (error) {
        console.error(`⚠️  Error obteniendo reviews de ${agency.name}:`, error);
        errors.push(`Reviews no disponibles para ${agency.name}`);
        
        // Fallback: continuar sin reviews si está habilitado
        if (!PIPELINE_CONFIG.reviewsConfig.fallbackToBasic) {
          return null;
        }
      }
    }
    
    // Análisis de confianza
    const trustAnalysis = analyzeTrust(reviews);
    
    // Calcular distancia aproximada desde la ubicación del usuario
    const distance = calculateDistance(
      agency.location.lat,
      agency.location.lng,
      // Aquí usaríamos la ubicación del usuario, por ahora usamos CDMX como ejemplo
      19.4326, // Lat CDMX
      -99.1332  // Lng CDMX
    );
    
    const result: AnalysisResult = {
      agency,
      trustAnalysis,
      reviews,
      reviewsCount: reviews.length,
      distance,
      deepAnalysis: undefined, // Se agregará después si es necesario
      timestamp: new Date()
    };
    
    console.log(`✅ ${agency.name} procesada: ${trustAnalysis.trustScore}/100 (${trustAnalysis.trustLevel})`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error procesando ${agency.name}:`, error);
    return null;
  }
}

/**
 * Agregar análisis profundo a las top agencias
 */
async function addDeepAnalysisToTopAgencies(results: AnalysisResult[], errors: string[]): Promise<void> {
  console.log('🔎 Agregando análisis profundo a top agencias...');
  
  const topAgencies = results
    .filter(r => r.trustAnalysis.trustScore >= PIPELINE_CONFIG.deepAnalysisConfig.minTrustScore)
    .slice(0, 3); // Top 3 agencias
  
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