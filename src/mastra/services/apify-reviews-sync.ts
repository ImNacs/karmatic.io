/**
 * Wrapper simplificado para Apify Google Maps Reviews Scraper
 * Usa endpoint sincrónico para obtener resultados directamente
 */

import { Review } from '../types';
import { REVIEW_ANALYSIS_CONFIG } from '../config/analysis.config';

// Configuración de Apify
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_SYNC_URL = 'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items';

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

/**
 * Obtiene reviews de una agencia usando el endpoint sincrónico
 */
export async function getReviewsSync(
  placeId: string,
  reviewsStartDate?: string,
  sort: 'newest' | 'mostRelevant' | 'highestRanking' | 'lowestRanking' = 'newest',
  maxReviews?: number
): Promise<Review[]> {
  
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN no configurada');
  }
  
  console.log('🔄 Obteniendo reviews sincrónicas para:', placeId);
  
  try {
    const actorInput = {
      personalData: true,
      placeIds: [placeId],
      reviewsOrigin: 'google',
      reviewsSort: sort,
      reviewsStartDate: reviewsStartDate || REVIEW_ANALYSIS_CONFIG.startDate,
      language: 'es-419',
      ...(maxReviews && { maxReviews })
    };
    
    const response = await fetch(APIFY_SYNC_URL, {
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
    
    const apifyResults: ApifyReviewResult[] = await response.json();
    
    // Convertir formato de Apify a nuestro formato
    const reviews: Review[] = apifyResults.map(item => ({
      id: item.reviewId || `${item.reviewerName}-${item.publishedAtDate}`,
      author: item.reviewerName,
      rating: item.stars,
      text: item.text || '', // Asegurar que siempre haya un string (vacío si no hay texto)
      date: item.publishedAtDate,
      response: item.responseFromOwner ? {
        text: item.responseFromOwner.text,
        date: item.responseFromOwner.publishedAtDate
      } : undefined
    }));
    
    console.log(`✅ Obtenidas ${reviews.length} reviews sincrónicas`);
    
    return reviews;
    
  } catch (error) {
    console.error('❌ Error obteniendo reviews sincrónicas:', error);
    throw error;
  }
}


/**
 * Obtiene las reseñas más relevantes para validación
 */
export async function getRelevantReviewsForValidation(
  placeId: string, 
  maxReviews?: number
): Promise<Review[]> {
  console.log(`🎯 Obteniendo reseñas para validación...`);
  
  try {
    return await getReviewsSync(
      placeId, 
      undefined, // Usar configuración por defecto
      'mostRelevant', // Para validación queremos las más relevantes
      maxReviews
    );
  } catch (error) {
    console.error('❌ Error obteniendo reseñas relevantes:', error);
    return [];
  }
}