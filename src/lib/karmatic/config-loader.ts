/**
 * Carga y valida la configuración desde archivos JSON externos
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Interfaz para el archivo de criterios de filtrado
 */
export interface FilteringCriteria {
  version: string;
  last_updated: string;
  description: string;
  
  businessTypes: {
    validTypes: string[];
    forbiddenTypes: string[];
    motorcycleTypes: string[];
  };
  
  nameKeywords: {
    forbidden: string[];
    motorcycleBrands: string[];
    carBrands: string[];
  };
  
  reviewKeywords: {
    motorcycle: string[];
    rental: string[];
    serviceOnly: string[];
    fraudIndicators: string[];
  };
  
  websiteDomains: {
    forbidden: string[];
  };
  
  thresholds: {
    minReviewsForAnalysis: number;
    maxReviewsToAnalyze: number;
    negativeReviewThreshold: number;
    fraudKeywordThreshold: number;
    motorcycleKeywordThreshold: number;
    rentalKeywordThreshold: number;
    serviceOnlyThreshold: number;
    positiveReviewBonus: number;
    minRatingForTrusted: number;
    minReviewsForTrusted: number;
  };
  
  scoring: {
    baseScore: number;
    ratingMultiplier: number;
    reviewCountBonus: {
      min: number;
      max: number;
      maxBonus: number;
    };
    forbiddenDomainPenalty: number;
    fraudKeywordPenalty: number;
    motorcyclePenalty: number;
    rentalPenalty: number;
    serviceOnlyPenalty: number;
  };
  
  features: {
    includeMotorcycles: boolean;
    includeRentals: boolean;
    includeServiceOnly: boolean;
    expandSearchRadius: boolean;
    maxRadiusExpansion: number;
    cacheValidationResults: boolean;
    cacheTTLSeconds: number;
    validateWebsiteDomains: boolean;
    detectFalsePositives: boolean;
  };
  
  validation?: {
    minConfidenceToAnalyze: number;
    maxReviewsForValidation: number;
    validationStrategy: string;
    validationTimeframeYears: number;
    cacheValidationResults: boolean;
    validationCacheTTLHours: number;
  };
  
  keywords?: {
    automotive: string[];
    nonAutomotive: string[];
  };
}

// Cache para evitar leer el archivo múltiples veces
let cachedCriteria: FilteringCriteria | null = null;
let lastLoadTime = 0;
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Carga los criterios de filtrado desde el archivo JSON
 * @param forceReload - Forzar recarga ignorando el cache
 * @returns Criterios de filtrado
 */
export function loadFilteringCriteria(forceReload = false): FilteringCriteria {
  const now = Date.now();
  
  // Usar cache si está disponible y no ha expirado
  if (!forceReload && cachedCriteria && (now - lastLoadTime) < CACHE_DURATION) {
    return cachedCriteria;
  }
  
  try {
    // Intentar cargar desde el directorio del proyecto
    const configPath = join(process.cwd(), 'src', 'lib', 'karmatic', 'filtering-criteria.json');
    const configContent = readFileSync(configPath, 'utf-8');
    
    cachedCriteria = JSON.parse(configContent) as FilteringCriteria;
    lastLoadTime = now;
    
    console.log(`✅ Configuración de filtrado cargada (v${cachedCriteria.version})`);
    return cachedCriteria;
  } catch (error) {
    console.error('❌ Error cargando configuración de filtrado:', error);
    
    // Fallback a configuración por defecto
    return getDefaultFilteringCriteria();
  }
}

/**
 * Obtiene una configuración por defecto como fallback
 */
function getDefaultFilteringCriteria(): FilteringCriteria {
  return {
    version: "1.0.0",
    last_updated: new Date().toISOString().split('T')[0],
    description: "Configuración por defecto (fallback)",
    
    businessTypes: {
      validTypes: ["car_dealer", "car_repair", "auto_repair_shop"],
      forbiddenTypes: ["car_rental", "motorcycle_dealer"],
      motorcycleTypes: ["motorcycle_dealer", "motorcycle_repair"]
    },
    
    nameKeywords: {
      forbidden: ["moto", "renta", "alquiler"],
      motorcycleBrands: ["honda motos", "yamaha", "italika"],
      carBrands: ["toyota", "nissan", "ford", "chevrolet", "volkswagen"]
    },
    
    reviewKeywords: {
      motorcycle: ["moto", "motocicleta"],
      rental: ["renta", "alquiler"],
      serviceOnly: ["solo servicio", "no venden"],
      fraudIndicators: ["estafa", "fraude", "engaño"]
    },
    
    websiteDomains: {
      forbidden: ["kavak.com", "seminuevos.com"]
    },
    
    thresholds: {
      minReviewsForAnalysis: 5,
      maxReviewsToAnalyze: 15,
      negativeReviewThreshold: 0.2,
      fraudKeywordThreshold: 0.15,
      motorcycleKeywordThreshold: 0.3,
      rentalKeywordThreshold: 0.25,
      serviceOnlyThreshold: 0.2,
      positiveReviewBonus: 0.1,
      minRatingForTrusted: 4.5,
      minReviewsForTrusted: 50
    },
    
    scoring: {
      baseScore: 50,
      ratingMultiplier: 10,
      reviewCountBonus: {
        min: 10,
        max: 100,
        maxBonus: 20
      },
      forbiddenDomainPenalty: -30,
      fraudKeywordPenalty: -25,
      motorcyclePenalty: -40,
      rentalPenalty: -35,
      serviceOnlyPenalty: -20
    },
    
    features: {
      includeMotorcycles: false,
      includeRentals: false,
      includeServiceOnly: false,
      expandSearchRadius: true,
      maxRadiusExpansion: 20000,
      cacheValidationResults: true,
      cacheTTLSeconds: 86400,
      validateWebsiteDomains: true,
      detectFalsePositives: true
    },
    
    validation: {
      minConfidenceToAnalyze: 70,
      maxReviewsForValidation: 15,
      validationStrategy: "relevance",
      validationTimeframeYears: 5,
      cacheValidationResults: true,
      validationCacheTTLHours: 24
    }
  };
}

/**
 * Invalida el cache para forzar recarga en el siguiente uso
 */
export function invalidateConfigCache(): void {
  cachedCriteria = null;
  lastLoadTime = 0;
}