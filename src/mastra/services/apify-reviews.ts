/**
 * Wrapper para Apify Google Maps Reviews Scraper
 * Obtiene TODAS las reviews de una agencia (cientos/miles)
 */

import { Review } from '../types';

// Configuración de Apify
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE_URL = 'https://api.apify.com/v2';
const REVIEWS_ACTOR_ID = 'compass~google-maps-reviews-scraper';

// Tipos para la respuesta de Apify
interface ApifyReviewResult {
  name: string;
  text: string;
  publishAt: string;
  publishedAtDate: string;
  likesCount: number;
  reviewId: string;
  reviewUrl: string;
  reviewerName: string;
  reviewerUrl: string;
  reviewerNumberOfReviews: number;
  isLocalGuide: boolean;
  stars: number;
  responseFromOwner?: {
    text: string;
    publishAt: string;
    publishedAtDate: string;
  };
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    statusMessage: string;
    startedAt: string;
    finishedAt?: string;
  };
}

/**
 * Inicia una ejecución del actor de Apify para obtener reviews
 */
export async function startReviewsScraping(
  placeId: string,
  maxReviews: number = 100,
  sort: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest'
): Promise<string> {
  
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN no configurada');
  }
  
  console.log('🚀 Iniciando scraping de reviews para:', {
    placeId,
    maxReviews,
    sort
  });
  
  try {
    // Configuración del actor con el formato correcto
    const actorInput = {
      personalData: true,
      placeIds: [placeId],
      reviewsOrigin: 'google',
      reviewsSort: sort,
      reviewsStartDate: '1 year',
      language: 'es-419' // Español para México
    };
    
    // Ejecutar el actor
    const response = await fetch(`${APIFY_BASE_URL}/acts/${REVIEWS_ACTOR_ID}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`
      },
      body: JSON.stringify(actorInput)
    });
    
    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
    }
    
    const runData: ApifyRunResponse = await response.json();
    const runId = runData.data.id;
    
    console.log(`✅ Scraping iniciado, run ID: ${runId}`);
    
    return runId;
    
  } catch (error) {
    console.error('❌ Error iniciando scraping:', error);
    throw error;
  }
}

/**
 * Verifica el estado de una ejecución de Apify
 */
export async function checkScrapingStatus(runId: string): Promise<'RUNNING' | 'SUCCEEDED' | 'FAILED'> {
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN no configurada');
  }
  
  try {
    const response = await fetch(`${APIFY_BASE_URL}/acts/${REVIEWS_ACTOR_ID}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error checking status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.status;
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    return 'FAILED';
  }
}

/**
 * Obtiene los resultados de una ejecución completada
 */
export async function getScrapingResults(runId: string): Promise<Review[]> {
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN no configurada');
  }
  
  try {
    const response = await fetch(`${APIFY_BASE_URL}/acts/${REVIEWS_ACTOR_ID}/runs/${runId}/dataset/items`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error obteniendo resultados: ${response.status}`);
    }
    
    const apifyResults: ApifyReviewResult[] = await response.json();
    
    // Convertir formato de Apify a nuestro formato
    const reviews: Review[] = apifyResults.map(item => ({
      id: item.reviewId || `${item.reviewerName}-${item.publishedAtDate}`,
      author: item.reviewerName,
      rating: item.stars,
      text: item.text,
      date: item.publishedAtDate,
      response: item.responseFromOwner ? {
        text: item.responseFromOwner.text,
        date: item.responseFromOwner.publishedAtDate
      } : undefined
    }));
    
    console.log(`✅ Convertidas ${reviews.length} reviews de Apify`);
    
    return reviews;
    
  } catch (error) {
    console.error('❌ Error obteniendo resultados:', error);
    throw error;
  }
}

/**
 * Función principal que maneja todo el proceso de scraping
 * Incluye polling para esperar a que termine
 */
export async function scrapeAllReviews(
  placeId: string,
  maxReviews: number = 200,
  maxWaitTime: number = 60000 // 60 segundos máximo
): Promise<Review[]> {
  
  console.log('🔄 Iniciando scraping completo de reviews...');
  
  try {
    // Iniciar scraping
    const runId = await startReviewsScraping(placeId, maxReviews);
    
    // Polling para esperar resultado
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await checkScrapingStatus(runId);
      
      if (status === 'SUCCEEDED') {
        console.log('✅ Scraping completado exitosamente');
        return await getScrapingResults(runId);
      }
      
      if (status === 'FAILED') {
        throw new Error('Scraping falló en Apify');
      }
      
      // Esperar 3 segundos antes del próximo check
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('⏳ Esperando que termine el scraping...');
    }
    
    throw new Error('Timeout: Scraping tardó demasiado');
    
  } catch (error) {
    console.error('❌ Error en scraping completo:', error);
    throw error;
  }
}

/**
 * Función simplificada para obtener reviews rápidamente
 * Usa límites más bajos para respuesta más rápida
 */
export async function getQuickReviews(placeId: string): Promise<Review[]> {
  console.log('⚡ Obteniendo reviews rápidamente...');
  
  try {
    // Usar límite más bajo para respuesta más rápida
    return await scrapeAllReviews(placeId, 50, 30000); // 50 reviews máximo, 30s timeout
    
  } catch (error) {
    console.error('❌ Error obteniendo reviews rápidas:', error);
    // Retornar array vacío en caso de error para no bloquear el flujo
    return [];
  }
}