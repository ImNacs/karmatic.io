// N8N API Client for Karmatic.io

export interface LocationSearchRequest {
  location: string;
  query: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  placeDetails?: {
    description?: string;
    mainText?: string;
    secondaryText?: string;
  };
}

export interface Agency {
  id: string;
  name: string;
  address: string;
  distance?: string;
  rating?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  latitude: number;
  longitude: number;
  placeId?: string;
  // Additional fields from n8n response
  userRatingsTotal?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time?: number;
    language?: string;
  }>;
  businessStatus?: string;
  googleMapsUrl?: string;
  vicinity?: string;
  priceLevel?: number | null;
  plusCode?: string;
}

export interface LocationSearchResponse {
  success: boolean;
  agencies: Agency[];
  totalResults: number;
  searchLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  error?: string;
}

export interface AnalysisRequest {
  agencies: Agency[];
  userQuery: string;
  userLocation: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis: {
    summary: string;
    recommendations: Array<{
      agencyId: string;
      agencyName: string;
      score: number;
      reasons: string[];
    }>;
    insights: string[];
  };
  error?: string;
}

class N8NApiClient {
  private locateAgenciesEndpoint: string;
  private analyzeAgenciesEndpoint: string;

  constructor() {
    this.locateAgenciesEndpoint = process.env.NEXT_PUBLIC_N8N_LOCATE_AGENCIES_WEBHOOK || '';
    this.analyzeAgenciesEndpoint = process.env.NEXT_PUBLIC_N8N_ANALYZE_AGENCIES_WEBHOOK || '';

    if (!this.locateAgenciesEndpoint) {
      console.warn('N8N_LOCATE_AGENCIES_WEBHOOK is not configured');
    }
    if (!this.analyzeAgenciesEndpoint) {
      console.warn('N8N_ANALYZE_AGENCIES_WEBHOOK is not configured');
    }
  }

  /**
   * Search for agencies near a given location
   */
  async searchAgencies(request: LocationSearchRequest): Promise<LocationSearchResponse> {
    if (!this.locateAgenciesEndpoint) {
      throw new Error('El endpoint de búsqueda de agencias no está configurado');
    }

    try {
      const requestBody = {
        location: request.location,
        query: request.query,
        coordinates: {
          lat: request.latitude,
          lng: request.longitude,
        },
        placeId: request.placeId,
        placeDetails: request.placeDetails,
        timestamp: new Date().toISOString(),
        source: 'karmatic-web',
      };
      
      console.log('N8N API Request:', requestBody);
      
      const response = await fetch(this.locateAgenciesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('N8N API Response:', data);

      // Handle the actual n8n response structure
      const responseData = Array.isArray(data) ? data[0] : data;
      const agencies = responseData?.data?.calificados || [];

      // Transform the response to match our interface
      return {
        success: responseData?.success || false,
        agencies: agencies.map((agency: {
          place_id: string;
          name: string;
          address: string;
          distance?: string;
          rating?: number;
          phone?: string;
          website?: string;
          opening_hours?: string[];
          location?: { lat: number; lng: number };
          user_ratings_total?: number;
          reviews?: Array<{
            author_name: string;
            rating: number;
            relative_time_description: string;
            text: string;
            time?: number;
            language?: string;
          }>;
          business_status?: string;
          google_maps_url?: string;
          vicinity?: string;
          price_level?: number | null;
          plus_code?: string;
        }) => ({
          id: agency.place_id,
          name: agency.name,
          address: agency.address,
          distance: agency.distance,
          rating: agency.rating,
          phoneNumber: agency.phone,
          website: agency.website,
          openingHours: agency.opening_hours,
          latitude: agency.location?.lat,
          longitude: agency.location?.lng,
          placeId: agency.place_id,
          // Additional fields from the response
          userRatingsTotal: agency.user_ratings_total,
          reviews: agency.reviews,
          businessStatus: agency.business_status,
          googleMapsUrl: agency.google_maps_url,
          vicinity: agency.vicinity,
          priceLevel: agency.price_level,
          plusCode: agency.plus_code,
        })),
        totalResults: agencies.length,
        searchLocation: {
          address: request.location,
          latitude: request.latitude || agencies[0]?.location?.lat || 0,
          longitude: request.longitude || agencies[0]?.location?.lng || 0,
        },
      };
    } catch (error) {
      console.error('Error searching agencies:', error);
      return {
        success: false,
        agencies: [],
        totalResults: 0,
        searchLocation: {
          address: request.location,
          latitude: request.latitude || 0,
          longitude: request.longitude || 0,
        },
        error: error instanceof Error ? error.message : 'Error desconocido al buscar agencias',
      };
    }
  }

  /**
   * Analyze selected agencies based on user query
   */
  async analyzeAgencies(request: AnalysisRequest): Promise<AnalysisResponse> {
    if (!this.analyzeAgenciesEndpoint) {
      throw new Error('El endpoint de análisis de agencias no está configurado');
    }

    try {
      const response = await fetch(this.analyzeAgenciesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencies: request.agencies,
          userQuery: request.userQuery,
          userLocation: request.userLocation,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el análisis: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        analysis: {
          summary: data.summary || '',
          recommendations: data.recommendations || [],
          insights: data.insights || [],
        },
      };
    } catch (error) {
      console.error('Error analyzing agencies:', error);
      return {
        success: false,
        analysis: {
          summary: '',
          recommendations: [],
          insights: [],
        },
        error: error instanceof Error ? error.message : 'Error desconocido al analizar agencias',
      };
    }
  }

  /**
   * Check if the API endpoints are configured
   */
  isConfigured(): boolean {
    return Boolean(this.locateAgenciesEndpoint && this.analyzeAgenciesEndpoint);
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { locate: boolean; analyze: boolean } {
    return {
      locate: Boolean(this.locateAgenciesEndpoint),
      analyze: Boolean(this.analyzeAgenciesEndpoint),
    };
  }
}

// Export a singleton instance
export const n8nApi = new N8NApiClient();

// Export types for use in components
export type { N8NApiClient };