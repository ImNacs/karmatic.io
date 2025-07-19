/**
 * Google Places API con Text Search
 * Busca agencias automotrices de forma inteligente y contextual
 */

import { Agency, Location } from '../types';
import { SEARCH_CONFIG, AGENCY_FILTERS } from '../config/analysis.config';

// Configuración de la API
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const PLACES_V1_URL = 'https://places.googleapis.com/v1/places:searchNearby';

if (!GOOGLE_PLACES_API_KEY) {
  throw new Error('GOOGLE_PLACES_API_KEY no está configurada');
}

/**
 * Busca agencias usando Google Places API v1 (New API)
 * Devuelve teléfono y sitio web en una sola llamada
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
  
  console.log('🔍 Búsqueda con Places API v1 (con phone/website):', {
    includedTypes: ['car_dealer'],
    radius: radiusMeters || SEARCH_CONFIG.radiusMeters,
    location: location
  });
  
  try {
    // Usar la nueva Places API v1 que devuelve phone y website
    const requestBody = {
      includedTypes: ['car_dealer'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng
          },
          radius: radiusMeters || SEARCH_CONFIG.radiusMeters
        }
      },
      languageCode: SEARCH_CONFIG.language
    };
    
    // Headers con API key y field mask
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.types,places.currentOpeningHours'
    };
    
    // Realizar búsqueda
    const response = await fetch(PLACES_V1_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Google Places API v1 error: ${data.error.message}`);
    }
    
    console.log(`✅ Encontradas ${data.places?.length || 0} agencias (sin filtrar)`);
    
    // Aplicar todos los filtros incluyendo teléfono y website
    const filteredResults = (data.places || []).filter((place: any) => {
      // Filtro por rating mínimo
      if (AGENCY_FILTERS.minRating && place.rating < AGENCY_FILTERS.minRating) {
        console.log(`❌ Filtrado por rating bajo: ${place.displayName?.text} (${place.rating})`);
        return false;
      }
      
      // Filtro por número mínimo de reseñas
      if (AGENCY_FILTERS.minReviews && place.userRatingCount < AGENCY_FILTERS.minReviews) {
        console.log(`❌ Filtrado por pocas reseñas: ${place.displayName?.text} (${place.userRatingCount} reseñas)`);
        return false;
      }
      
      // Filtro por teléfono (ahora disponible en la respuesta inicial)
      if (AGENCY_FILTERS.requirePhone && !place.nationalPhoneNumber) {
        console.log(`❌ Filtrado por falta de teléfono: ${place.displayName?.text}`);
        return false;
      }
      
      // Filtro por sitio web (ahora disponible en la respuesta inicial)
      if (AGENCY_FILTERS.requireWebsite && !place.websiteUri) {
        console.log(`❌ Filtrado por falta de sitio web: ${place.displayName?.text}`);
        return false;
      }
      
      // Filtro por dominios bloqueados
      if (place.websiteUri && isBlockedDomain(place.websiteUri, AGENCY_FILTERS.blockedDomains)) {
        console.log(`❌ Filtrado por dominio bloqueado: ${place.displayName?.text} (${place.websiteUri})`);
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
        place.location.latitude,
        place.location.longitude
      );
      return { ...place, distance };
    });
    
    // Ordenar por distancia (los más cercanos primero)
    agenciesWithDistance.sort((a: any, b: any) => a.distance - b.distance);
    
    // Convertir a nuestro formato
    const agencies: Agency[] = agenciesWithDistance.map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text || 'Sin nombre',
      address: place.formattedAddress,
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude
      },
      rating: place.rating,
      totalReviews: place.userRatingCount,
      phoneNumber: place.nationalPhoneNumber,
      website: place.websiteUri,
      openingHours: place.currentOpeningHours?.weekdayDescriptions,
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
