/**
 * Validador de negocios automotrices
 * Analiza reseñas para determinar si un negocio es realmente automotriz
 */

import { Review } from './types';
import { ANALYSIS_CONFIG } from './config';
import { loadFilteringCriteria } from './config-loader';

/**
 * Resultado de la validación
 */
export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  automotiveReviewsCount: number;
  totalReviewsAnalyzed: number;
  matchedKeywords: string[];
  excludedKeywords: string[];
  reason: string;
}

/**
 * Valida si un negocio es automotriz basándose en sus reseñas
 * @param businessName - Nombre del negocio
 * @param reviews - Reseñas a analizar
 * @returns Resultado de la validación
 */
export function validateAutomotiveBusiness(
  businessName: string,
  reviews: Review[]
): ValidationResult {
  console.log(`🔍 Validando negocio: ${businessName} (${reviews.length} reseñas disponibles)`);
  
  // Si no hay reseñas, no podemos validar
  if (!reviews || reviews.length === 0) {
    return {
      isValid: true, // Asumimos válido por defecto si no hay reseñas
      confidence: 0,
      automotiveReviewsCount: 0,
      totalReviewsAnalyzed: 0,
      matchedKeywords: [],
      excludedKeywords: [],
      reason: 'Sin reseñas para validar'
    };
  }
  
  const config = ANALYSIS_CONFIG.validation;
  const filterCriteria = loadFilteringCriteria();
  
  // Ordenar reseñas por relevancia para validación
  // Criterios: 
  // 1. Longitud del texto (más detalle = más información)
  // 2. Variedad de ratings (evitar sesgo de solo reviews positivas/negativas)
  // 3. NO por fecha (queremos muestra representativa, no solo recientes)
  const reviewsToAnalyze = reviews
    .filter(r => r.text && r.text.length > 20) // Solo reseñas con contenido significativo
    .sort((a, b) => {
      // Priorizar reseñas con más contenido (máx 3 puntos)
      const lengthScoreA = Math.min(a.text.length / 100, 3);
      const lengthScoreB = Math.min(b.text.length / 100, 3);
      
      // Priorizar ratings intermedios que suelen ser más detallados
      // 3 estrellas = 2 puntos (más objetivas)
      // 2 o 4 estrellas = 1 punto (balance)
      // 1 o 5 estrellas = 0 puntos (pueden ser extremas)
      const ratingScoreA = a.rating === 3 ? 2 : (a.rating === 2 || a.rating === 4) ? 1 : 0;
      const ratingScoreB = b.rating === 3 ? 2 : (b.rating === 2 || b.rating === 4) ? 1 : 0;
      
      // Score total para ordenamiento
      const scoreA = lengthScoreA + ratingScoreA;
      const scoreB = lengthScoreB + ratingScoreB;
      
      return scoreB - scoreA; // Ordenar descendente por relevancia
    })
    .slice(0, filterCriteria.thresholds.maxReviewsToAnalyze || config.reviewsToAnalyze);
  
  console.log(`📊 Analizando ${reviewsToAnalyze.length} reseñas más relevantes`);
  
  if (reviewsToAnalyze.length === 0) {
    return {
      isValid: true, // Asumimos válido si no hay reseñas con texto
      confidence: 0,
      automotiveReviewsCount: 0,
      totalReviewsAnalyzed: 0,
      matchedKeywords: [],
      excludedKeywords: [],
      reason: 'Reseñas sin contenido suficiente para validar'
    };
  }
  
  // Analizar cada reseña
  let automotiveReviewsCount = 0;
  const allMatchedKeywords = new Set<string>();
  const allExcludedKeywords = new Set<string>();
  
  for (const review of reviewsToAnalyze) {
    const reviewText = review.text.toLowerCase();
    
    // Buscar palabras clave automotrices (usar JSON si disponible, sino config.ts)
    const automotiveKeywords = filterCriteria.keywords?.automotive || [
      ...config.automotiveKeywords,
      ...filterCriteria.nameKeywords.carBrands
    ];
    const automotiveMatches = automotiveKeywords.filter(keyword => 
      reviewText.includes(keyword.toLowerCase())
    );
    
    // Buscar palabras clave de exclusión (usar JSON si disponible)
    const excludeKeywords = filterCriteria.keywords?.nonAutomotive || [
      ...config.excludeKeywords,
      ...filterCriteria.reviewKeywords.motorcycle,
      ...filterCriteria.reviewKeywords.rental,
      ...filterCriteria.reviewKeywords.serviceOnly
    ];
    const excludeMatches = excludeKeywords.filter(keyword => 
      reviewText.includes(keyword.toLowerCase())
    );
    
    // Buscar indicadores de fraude
    const fraudMatches = filterCriteria.reviewKeywords.fraudIndicators.filter(keyword =>
      reviewText.includes(keyword.toLowerCase())
    );
    
    // Si hay muchos indicadores de fraude, marcar como no automotriz
    if (fraudMatches.length >= 2) {
      excludeMatches.push(...fraudMatches);
    }
    
    // Agregar a los sets
    automotiveMatches.forEach(k => allMatchedKeywords.add(k));
    excludeMatches.forEach(k => allExcludedKeywords.add(k));
    
    // Si tiene más palabras automotrices que de exclusión, es una reseña automotriz
    if (automotiveMatches.length > excludeMatches.length) {
      automotiveReviewsCount++;
    }
  }
  
  // Calcular porcentaje
  const automotivePercentage = (automotiveReviewsCount / reviewsToAnalyze.length) * 100;
  
  // Ajustar umbral según configuración JSON
  const minPercentage = filterCriteria.features.includeMotorcycles ? 40 : config.minAutomotivePercentage;
  
  const confidence = Math.min(100, Math.round(automotivePercentage * 1.2)); // Boost de confianza
  
  // Verificar también el nombre del negocio
  const businessNameLower = businessName.toLowerCase();
  
  // Combinar keywords automotrices
  const allAutomotiveKeywords = [
    ...config.automotiveKeywords,
    ...filterCriteria.nameKeywords.carBrands
  ];
  const nameHasAutomotiveKeyword = allAutomotiveKeywords.some(keyword => 
    businessNameLower.includes(keyword.toLowerCase())
  );
  
  // Verificar keywords prohibidas
  const nameHasForbiddenKeyword = filterCriteria.nameKeywords.forbidden.some(keyword => {
    // Búsqueda exacta de palabra completa
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
    return regex.test(businessNameLower);
  });
  
  // Verificar si es negocio de motos
  const nameHasMotorcycleKeyword = filterCriteria.nameKeywords.motorcycleBrands.some(keyword =>
    businessNameLower.includes(keyword.toLowerCase())
  );
  
  const nameHasExcludeKeyword = nameHasForbiddenKeyword || 
    (nameHasMotorcycleKeyword && !filterCriteria.features.includeMotorcycles);
  
  // Decisión final
  let isValid = automotivePercentage >= minPercentage;
  let reason = '';
  
  // Casos especiales
  if (nameHasExcludeKeyword && !nameHasAutomotiveKeyword) {
    isValid = false;
    reason = `El nombre "${businessName}" sugiere un negocio no automotriz`;
  } else if (nameHasAutomotiveKeyword && automotivePercentage >= 20) {
    // Más flexible si el nombre sugiere automotriz
    isValid = true;
    reason = `Nombre automotriz con ${automotivePercentage.toFixed(0)}% de reseñas automotrices`;
  } else if (automotivePercentage >= minPercentage) {
    reason = `${automotivePercentage.toFixed(0)}% de reseñas mencionan temas automotrices`;
  } else {
    reason = `Solo ${automotivePercentage.toFixed(0)}% de reseñas son automotrices (mínimo: ${minPercentage}%)`;
  }
  
  console.log(`✅ Validación completada: ${isValid ? 'VÁLIDO' : 'NO VÁLIDO'} - ${reason}`);
  
  return {
    isValid,
    confidence,
    automotiveReviewsCount,
    totalReviewsAnalyzed: reviewsToAnalyze.length,
    matchedKeywords: Array.from(allMatchedKeywords),
    excludedKeywords: Array.from(allExcludedKeywords),
    reason
  };
}

/**
 * Función auxiliar para determinar si una agencia debe ser procesada
 * basándose en su validación inicial
 */
export function shouldProcessAgency(
  validationResult: ValidationResult,
  agencyRating?: number
): boolean {
  // Siempre procesar si es válido
  if (validationResult.isValid) return true;
  
  // Si tiene muy buen rating (4.5+) y al menos algo de confianza, darle oportunidad
  if (agencyRating && agencyRating >= 4.5 && validationResult.confidence >= 25) {
    return true;
  }
  
  // Si no hay suficientes reseñas para validar, procesar de todos modos
  if (validationResult.totalReviewsAnalyzed < 3) {
    return true;
  }
  
  return false;
}