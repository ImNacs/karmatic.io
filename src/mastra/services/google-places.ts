/**
 * Google Places API con Text Search
 * Busca agencias automotrices de forma inteligente y contextual
 */

import { Agency, Location } from '../types';
import { SEARCH_CONFIG, AGENCY_FILTERS } from '../config/analysis.config';

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
  
  // NO USAR KEYWORD - El query es para análisis, no para filtrar
  // Dejar que Google devuelva TODAS las agencias en el radio
  
  console.log('🔍 Búsqueda con Nearby Search API (radio estricto):', {
    type: 'car_dealer',
    radius: radiusMeters || SEARCH_CONFIG.radiusMeters,
    location: location
  });
  
  try {
    // Usar Nearby Search API para control estricto de distancia
    const searchUrl = new URL(`${PLACES_BASE_URL}/nearbysearch/json`);
    
    // Ubicación (requerida para Nearby Search)
    searchUrl.searchParams.append('location', `${location.lat},${location.lng}`);
    
    // Radio en metros (límite estricto)
    searchUrl.searchParams.append('radius', (radiusMeters || SEARCH_CONFIG.radiusMeters).toString());
    
    // Tipo de negocio para agencias automotrices
    searchUrl.searchParams.append('type', 'car_dealer');
    
    // NO USAR KEYWORD - obtener TODAS las agencias en el radio
    
    // Idioma
    searchUrl.searchParams.append('language', SEARCH_CONFIG.language);
    
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
    
    // Aplicar filtros pre-reseñas para optimizar recursos
    const filteredResults = (data.results || []).filter((place: any) => {
      // Filtro por rating mínimo
      if (AGENCY_FILTERS.minRating && place.rating < AGENCY_FILTERS.minRating) {
        console.log(`❌ Filtrado por rating bajo: ${place.name} (${place.rating})`);
        return false;
      }
      
      // Filtro por número mínimo de reseñas
      if (AGENCY_FILTERS.minReviews && place.user_ratings_total < AGENCY_FILTERS.minReviews) {
        console.log(`❌ Filtrado por pocas reseñas: ${place.name} (${place.user_ratings_total} reseñas)`);
        return false;
      }
      
      // Filtro por teléfono requerido
      if (AGENCY_FILTERS.requirePhone && !place.formatted_phone_number) {
        console.log(`❌ Filtrado por falta de teléfono: ${place.name}`);
        return false;
      }
      
      // Filtro por sitio web requerido
      if (AGENCY_FILTERS.requireWebsite && !place.website) {
        console.log(`❌ Filtrado por falta de sitio web: ${place.name}`);
        return false;
      }
      
      // Filtro por dominios bloqueados
      if (place.website && isBlockedDomain(place.website, AGENCY_FILTERS.blockedDomains)) {
        console.log(`❌ Filtrado por dominio bloqueado: ${place.name} (${place.website})`);
        return false;
      }
      
      return true;
    });
    
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
    agenciesWithDistance.sort((a: any, b: any) => a.distance - b.distance);
    
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
      distanceKm: Math.round(place.distance / 100) / 10 // Redondear a 1 decimal
    }));
    
    // Ordenar por rating y distancia
    agencies.sort((a, b) => {
      // Primero por rating
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.1) return ratingDiff; // Si hay diferencia significativa en rating
      
      // Si ratings similares, ordenar por distancia (más cercanos primero)
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });
    
    return agencies;
    
  } catch (error) {
    console.error('❌ Error en búsqueda moderna:', error);
    throw error;
  }
}

/**
 * Extrae el dominio de una URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Verifica si un dominio está bloqueado
 */
function isBlockedDomain(url: string, blockedDomains: string[]): boolean {
  if (!url) return false;
  
  const domain = extractDomain(url);
  if (!domain) return false;
  
  // Verificar si el dominio o cualquier subdominio está bloqueado
  return blockedDomains.some(blocked => 
    domain === blocked || domain.endsWith(`.${blocked}`)
  );
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
