/**
 * Cliente directo para Apify API
 * Reemplaza el uso de MCP para mayor estabilidad
 */

import { ApifyClient, Actor } from 'apify-client';

// Configuración
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

// Cliente singleton
let apifyClient: ApifyClient | null = null;

/**
 * Obtener instancia del cliente Apify
 */
export function getApifyClient(): ApifyClient | null {
  if (!APIFY_TOKEN) {
    console.warn('⚠️ APIFY_API_TOKEN no configurada');
    return null;
  }
  
  if (!apifyClient) {
    apifyClient = new ApifyClient({
      token: APIFY_TOKEN
    });
    console.log('✅ Cliente Apify inicializado');
  }
  
  return apifyClient;
}

/**
 * Ejecutar actor de Apify
 */
export async function runApifyActor<T = any>(
  actorId: string, 
  input: any,
  options?: {
    memory?: number;
    timeout?: number;
    waitForFinish?: number;
  }
): Promise<T | null> {
  const client = getApifyClient();
  if (!client) return null;
  
  try {
    console.log(`🎭 Ejecutando actor: ${actorId}`);
    
    const run = await client.actor(actorId).call(input, {
      memory: options?.memory || 256,
      timeout: options?.timeout || 60,
      waitForFinish: options?.waitForFinish || 120
    });
    
    if (!run) {
      console.error('❌ No se obtuvo respuesta del actor');
      return null;
    }
    
    // Obtener resultados del dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`✅ Actor completado: ${items.length} resultados`);
    return items as T;
    
  } catch (error) {
    console.error(`❌ Error ejecutando actor ${actorId}:`, error);
    return null;
  }
}

/**
 * Obtener reviews de Google Maps usando Apify
 */
export async function getGoogleMapsReviews(
  placeUrl: string,
  maxReviews: number = 100
): Promise<any[]> {
  const reviews = await runApifyActor(
    'compass/google-maps-reviews-scraper',
    {
      startUrls: [{ url: placeUrl }],
      maxReviews,
      language: 'es',
      personalData: false
    },
    {
      memory: 512,
      timeout: 180,
      waitForFinish: 300
    }
  );
  
  return reviews || [];
}

/**
 * Buscar lugares en Google Maps usando Apify
 */
export async function searchGoogleMapsPlaces(
  searchQuery: string,
  location?: { lat: number; lng: number },
  maxResults: number = 20
): Promise<any[]> {
  const input: any = {
    searchStringsArray: [searchQuery],
    maxCrawledPlacesPerSearch: maxResults,
    language: 'es',
    deeperCitySearch: true
  };
  
  // Si hay ubicación, agregar coordenadas
  if (location) {
    input.lat = location.lat;
    input.lng = location.lng;
    input.zoom = 13; // Zoom para búsqueda local
  }
  
  const places = await runApifyActor(
    'compass/google-maps-extractor',
    input,
    {
      memory: 1024,
      timeout: 300,
      waitForFinish: 600
    }
  );
  
  return places || [];
}

/**
 * Verificar si Apify está disponible
 */
export function isApifyAvailable(): boolean {
  return !!APIFY_TOKEN;
}