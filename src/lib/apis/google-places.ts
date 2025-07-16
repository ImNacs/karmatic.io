/**
 * Wrapper para Google Places API
 * Busca agencias automotrices cercanas a una ubicación
 */

import { Agency, Location } from '../karmatic/types';

// Configuración de la API
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Tipos específicos para la respuesta de Google Places
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  types: string[];
}

interface PlacesSearchResponse {
  results: PlaceResult[];
  status: string;
  error_message?: string;
}

/**
 * Busca agencias automotrices cercanas usando Google Places API
 */
export async function searchNearbyAgencies(
  location: Location,
  radius: number = 5000, // 5km por defecto
  keyword: string = 'auto dealership'
): Promise<Agency[]> {
  
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY no configurada');
  }
  
  console.log('🔍 Buscando agencias cerca de:', {
    lat: location.lat,
    lng: location.lng,
    radius,
    keyword
  });
  
  try {
    // Construir URL de búsqueda
    const searchUrl = new URL(`${PLACES_BASE_URL}/nearbysearch/json`);
    searchUrl.searchParams.append('location', `${location.lat},${location.lng}`);
    searchUrl.searchParams.append('radius', radius.toString());
    searchUrl.searchParams.append('type', 'car_dealer');
    searchUrl.searchParams.append('keyword', keyword);
    searchUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    
    // Realizar búsqueda
    const response = await fetch(searchUrl.toString());
    const data: PlacesSearchResponse = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
    }
    
    console.log(`✅ Encontradas ${data.results.length} agencias`);
    
    // Convertir resultados a nuestro formato
    const agencies: Agency[] = data.results.map(place => ({
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
      placeTypes: place.types
    }));
    
    return agencies;
    
  } catch (error) {
    console.error('❌ Error buscando agencias:', error);
    throw error;
  }
}

/**
 * Obtiene detalles adicionales de una agencia específica
 */
export async function getAgencyDetails(placeId: string): Promise<Agency | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY no configurada');
  }
  
  console.log('🔍 Obteniendo detalles de agencia:', placeId);
  
  try {
    const detailsUrl = new URL(`${PLACES_BASE_URL}/details/json`);
    detailsUrl.searchParams.append('place_id', placeId);
    detailsUrl.searchParams.append('fields', 'place_id,name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,website,opening_hours,types');
    detailsUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    
    const response = await fetch(detailsUrl.toString());
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('❌ Error obteniendo detalles:', data.status);
      return null;
    }
    
    const place = data.result;
    
    return {
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
      placeTypes: place.types
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo detalles de agencia:', error);
    return null;
  }
}

/**
 * Obtiene hasta 5 reviews de una agencia (limitación de Google Places)
 * NOTA: Solo devuelve 5 reviews máximo por limitación de la API
 */
export async function getBasicReviews(placeId: string): Promise<any[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY no configurada');
  }
  
  console.log('📝 Obteniendo reviews básicas de:', placeId);
  
  try {
    const detailsUrl = new URL(`${PLACES_BASE_URL}/details/json`);
    detailsUrl.searchParams.append('place_id', placeId);
    detailsUrl.searchParams.append('fields', 'reviews');
    detailsUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    
    const response = await fetch(detailsUrl.toString());
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('❌ Error obteniendo reviews:', data.status);
      return [];
    }
    
    const reviews = data.result?.reviews || [];
    console.log(`✅ Obtenidas ${reviews.length} reviews básicas`);
    
    return reviews;
    
  } catch (error) {
    console.error('❌ Error obteniendo reviews básicas:', error);
    return [];
  }
}