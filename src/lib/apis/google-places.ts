/**
 * Google Places API con Text Search
 * Busca agencias automotrices de forma inteligente y contextual
 */

import { Agency, Location } from '../karmatic/types';
import { ANALYSIS_CONFIG } from '../karmatic/config';
import { loadFilteringCriteria } from '../karmatic/config-loader';

// Configuración de la API
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Busca agencias usando Google Places Text Search API
 * Más precisa y contextual que Nearby Search
 */
export async function searchAgencies(
  location: Location,
  userQuery?: string,
  radiusMeters?: number
): Promise<Agency[]> {
  
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY no configurada');
  }
  
  const config = ANALYSIS_CONFIG.search;
  const filteringCriteria = loadFilteringCriteria();
  
  // NO USAR KEYWORD - El query es para análisis, no para filtrar
  // Dejar que Google devuelva TODAS las agencias en el radio
  
  console.log('🔍 Búsqueda con Nearby Search API (radio estricto):', {
    type: 'car_dealer',
    radius: radiusMeters || config.radiusMeters,
    location: location
  });
  
  try {
    // Usar Nearby Search API para control estricto de distancia
    const searchUrl = new URL(`${PLACES_BASE_URL}/nearbysearch/json`);
    
    // Ubicación (requerida para Nearby Search)
    searchUrl.searchParams.append('location', `${location.lat},${location.lng}`);
    
    // Radio en metros (límite estricto)
    searchUrl.searchParams.append('radius', (radiusMeters || config.radiusMeters).toString());
    
    // Tipo de negocio para agencias automotrices
    searchUrl.searchParams.append('type', 'car_dealer');
    
    // NO USAR KEYWORD - obtener TODAS las agencias en el radio
    
    // Idioma
    searchUrl.searchParams.append('language', config.language);
    
    // Solo negocios operando (opcional)
    // searchUrl.searchParams.append('opennow', 'true');
    
    searchUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    
    // Realizar búsqueda
    const response = await fetch(searchUrl.toString());
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
    }
    
    console.log(`✅ Encontradas ${data.results?.length || 0} agencias (sin filtrar)`);
    
    // NO FILTRAR - Dejar que las reseñas determinen el tipo de negocio
    const filteredResults = data.results || [];
    
    console.log(`✅ Después de filtros: ${filteredResults.length} agencias relevantes`);
    
    // Calcular distancias para información al usuario
    const agenciesWithDistance = filteredResults.map((place: any) => {
      const distance = calculateDistanceInMeters(
        location.lat,
        location.lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      return { ...place, distance };
    });
    
    // Ordenar por distancia (los más cercanos primero)
    agenciesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Convertir a nuestro formato
    const agencies: Agency[] = agenciesWithDistance.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      totalReviews: place.user_ratings_total,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      openingHours: place.opening_hours?.weekday_text,
      placeTypes: place.types,
      // Información adicional útil
      relevanceScore: calculateRelevance(place, userQuery),
      distanceKm: Math.round(place.distance / 100) / 10 // Redondear a 1 decimal
    }));
    
    // Ordenar por relevancia y rating
    agencies.sort((a, b) => {
      // Primero por relevancia
      const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (relevanceDiff !== 0) return relevanceDiff;
      
      // Luego por rating
      return (b.rating || 0) - (a.rating || 0);
    });
    
    return agencies;
    
  } catch (error) {
    console.error('❌ Error en búsqueda moderna:', error);
    throw error;
  }
}

/**
 * Calcula la relevancia de una agencia basándose en el query del usuario
 */
function calculateRelevance(place: any, userQuery?: string): number {
  let score = 0;
  
  // Base score por rating
  if (place.rating >= 4.5) score += 3;
  else if (place.rating >= 4.0) score += 2;
  else if (place.rating >= 3.5) score += 1;
  
  // Bonus por número de reseñas
  if (place.user_ratings_total >= 100) score += 2;
  else if (place.user_ratings_total >= 50) score += 1;
  
  // Si el usuario busca una marca específica
  if (userQuery) {
    const nameLower = place.name.toLowerCase();
    const queryLower = userQuery.toLowerCase();
    
    // Detectar marcas
    const brands = ['toyota', 'nissan', 'honda', 'mazda', 'kia', 'hyundai', 'ford', 
                    'chevrolet', 'volkswagen', 'bmw', 'mercedes', 'audi'];
    
    for (const brand of brands) {
      if (queryLower.includes(brand) && nameLower.includes(brand)) {
        score += 5; // Gran bonus por match de marca
        break;
      }
    }
    
    // Bonus para agencias multimarca/seminuevos con buena reputación
    if ((nameLower.includes('multimarca') || nameLower.includes('seminuevos')) && place.rating >= 4.0) {
      score += 2; // Bonus moderado para multimarca con buena calificación
    }
  }
  
  // Penalizar si es principalmente taller (no agencia)
  if (place.types?.includes('car_repair') && !place.types?.includes('car_dealer')) {
    score -= 2;
  }
  
  return Math.max(0, score);
}

/**
 * Calcula la distancia entre dos puntos en metros usando la fórmula de Haversine
 */
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance); // Distancia en metros
}
