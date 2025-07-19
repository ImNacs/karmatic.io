/**
 * Tipos TypeScript para el sistema de análisis de agencias
 * Versión simplificada para MVP - Fase 1
 */

// Ubicación geográfica
export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
}

// Query parseada del usuario
export interface ParsedQuery {
  // Texto original de la consulta
  originalQuery: string;
  
  // Información extraída
  marca?: string;
  modelo?: string;
  año?: number;
  precio?: 'barato' | 'medio' | 'caro';
  financiamiento?: boolean;
  
  // Ubicación del usuario
  location: Location;
  
  // Método usado para parsear
  parseMethod: 'regex' | 'perplexity' | 'fallback';
}

// Datos básicos de una agencia (Google Places)
export interface Agency {
  placeId: string;
  name: string;
  address: string;
  location: Location;
  rating?: number;
  totalReviews?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  placeTypes?: string[];
  // Campos adicionales de Google Places
  businessStatus?: string;
  priceLevel?: number;
  photos?: string[];
  // Campos calculados
  distanceKm?: number; // Distancia en kilómetros desde la ubicación del usuario
  // Campos temporales
  hours?: string;
  phone?: string;
}

// Review individual de una agencia
export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  response?: {
    text: string;
    date: string;
  };
}

// Análisis de confianza de una agencia
export interface TrustAnalysis {
  // Score principal (0-100)
  trustScore: number;
  
  // Nivel de confianza categórico
  trustLevel: 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja';
  
  // Métricas específicas
  metrics: {
    // Porcentaje de reviews positivas (4-5 estrellas)
    positiveReviewsPercent: number;
    
    // Número de palabras clave de fraude detectadas
    fraudKeywordsCount: number;
    
    // Porcentaje de quejas con respuesta
    responseRate: number;
    
    // Patrón de ratings (si hay manipulación)
    ratingPattern: 'natural' | 'sospechoso';
  };
  
  // Señales de alerta
  redFlags: string[];
  
  // Señales positivas
  greenFlags: string[];
}

// Resultado final de análisis para una agencia
export interface AnalysisResult {
  agency: Agency;
  reviews: Review[];
  trustAnalysis: TrustAnalysis;
  reviewsCount: number;
  distance: number; // Distancia en km desde la ubicación del usuario
  reviewMetrics?: {
    karmaScore: number | null;
    reviewFrequency: string | null;
    avgReviewsPerMonth: number | null;
    daysSinceLastReview: number | null;
  };
  deepAnalysis?: {
    inventoryUrl?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      website?: string;
    };
    recentNews?: string[];
    additionalInfo?: string;
  };
  timestamp: Date;
}

// Respuesta completa del endpoint
export interface AnalysisResponse {
  // Query procesada
  query: ParsedQuery;
  
  // Agencias encontradas y analizadas
  agencies: AnalysisResult[];
  
  // Metadata de la búsqueda
  searchMetadata: {
    totalFound: number;
    totalAnalyzed: number;
    executionTime: number;
    fromCache: boolean;
  };
  
  // Timestamp
  timestamp: string;
}

// Errores específicos del sistema
export interface KarmaticError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}