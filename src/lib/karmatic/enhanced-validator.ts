/**
 * Validador mejorado de agencias automotrices
 * Basado en el sistema de filtrado del script Python
 */

import { Agency, Review } from './types';
import { loadFilteringCriteria, FilteringCriteria } from './config-loader';

/**
 * Resultado detallado de validación
 */
export interface EnhancedValidationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  failureReasons: string[];
  score: number;
  details: {
    nameAnalysis: {
      hasCarBrand: boolean;
      hasForbiddenKeyword: boolean;
      hasMotorcycleBrand: boolean;
      matchedKeywords: string[];
    };
    websiteAnalysis: {
      hasForbiddenDomain: boolean;
      hasTrustedDomain: boolean;
      domain: string | null;
    };
    reviewAnalysis: {
      totalAnalyzed: number;
      motorcycleReviewRatio: number;
      rentalReviewRatio: number;
      serviceOnlyReviewRatio: number;
      fraudReviewRatio: number;
      matchedKeywords: Record<string, string[]>;
    };
    typeAnalysis: {
      hasValidType: boolean;
      hasForbiddenType: boolean;
      types: string[];
    };
  };
}

/**
 * Valida una agencia automotriz con criterios avanzados
 */
export class EnhancedAgencyValidator {
  private criteria: FilteringCriteria;
  
  constructor() {
    this.criteria = loadFilteringCriteria();
  }
  
  /**
   * Valida una agencia completa
   */
  public validateAgency(agency: Agency, reviews: Review[] = []): EnhancedValidationResult {
    const result: EnhancedValidationResult = {
      isValid: true,
      confidence: 0,
      reason: '',
      failureReasons: [],
      score: this.criteria.scoring.baseScore,
      details: {
        nameAnalysis: {
          hasCarBrand: false,
          hasForbiddenKeyword: false,
          hasMotorcycleBrand: false,
          matchedKeywords: []
        },
        websiteAnalysis: {
          hasForbiddenDomain: false,
          hasTrustedDomain: false,
          domain: null
        },
        reviewAnalysis: {
          totalAnalyzed: 0,
          motorcycleReviewRatio: 0,
          rentalReviewRatio: 0,
          serviceOnlyReviewRatio: 0,
          fraudReviewRatio: 0,
          matchedKeywords: {}
        },
        typeAnalysis: {
          hasValidType: false,
          hasForbiddenType: false,
          types: []
        }
      }
    };
    
    // VALIDACIÓN BASADA 100% EN RESEÑAS
    // Si tiene reseñas suficientes, analizar solo con ellas
    if (reviews.length >= this.criteria.thresholds.minReviewsForAnalysis) {
      this.analyzeReviews(reviews, result);
      this.calculateFinalScoreFromReviews(agency, result);
    } else {
      // Sin reseñas suficientes, asumir válido pero con baja confianza
      result.isValid = true;
      result.confidence = 50;
      result.reason = 'Agencia sin reseñas suficientes para análisis completo';
    }
    
    return result;
  }
  
  /**
   * Analiza los tipos de negocio
   */
  private analyzeBusinessTypes(agency: Agency, result: EnhancedValidationResult): void {
    const types = (agency as any).types || [];
    result.details.typeAnalysis.types = types;
    
    // Verificar tipos prohibidos
    const forbiddenTypes = types.filter((type: string) => 
      this.criteria.businessTypes.forbiddenTypes.includes(type)
    );
    
    if (forbiddenTypes.length > 0 && !this.shouldAllowForbiddenType(forbiddenTypes)) {
      result.details.typeAnalysis.hasForbiddenType = true;
      result.failureReasons.push(`Tipo de negocio no permitido: ${forbiddenTypes.join(', ')}`);
      result.score += this.criteria.scoring.forbiddenDomainPenalty; // Reusar penalización
    }
    
    // Verificar tipos válidos
    const validTypes = types.filter((type: string) =>
      this.criteria.businessTypes.validTypes.includes(type)
    );
    
    if (validTypes.length > 0) {
      result.details.typeAnalysis.hasValidType = true;
    } else if (!result.details.typeAnalysis.hasForbiddenType) {
      // No tiene tipo válido ni prohibido - NO PENALIZAR
      // Las reviews determinarán si es automotriz
      result.details.typeAnalysis.hasValidType = false;
    }
  }
  
  /**
   * Determina si permitir un tipo prohibido basado en features
   */
  private shouldAllowForbiddenType(forbiddenTypes: string[]): boolean {
    // Permitir motorcycle_dealer si includeMotorcycles está activo
    if (this.criteria.features.includeMotorcycles &&
        forbiddenTypes.some(t => this.criteria.businessTypes.motorcycleTypes.includes(t))) {
      return true;
    }
    
    // Permitir car_rental si includeRentals está activo
    if (this.criteria.features.includeRentals &&
        forbiddenTypes.includes('car_rental')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Analiza el nombre del negocio
   */
  private analyzeBusinessName(name: string, result: EnhancedValidationResult): void {
    const nameLower = name.toLowerCase();
    
    // Palabras positivas automotrices
    const automotiveKeywords = [
      'automotriz', 'automotor', 'agencia', 'concesionario', 
      'distribuidor', 'autos', 'automóviles', 'vehículos',
      'seminuevos', 'multimarca', 'showroom', 'cars'
    ];
    
    const hasAutomotiveKeyword = automotiveKeywords.some(kw => nameLower.includes(kw));
    
    // Verificar marcas de autos
    const carBrands = this.criteria.nameKeywords.carBrands.filter(brand =>
      nameLower.includes(brand.toLowerCase())
    );
    
    if (carBrands.length > 0) {
      result.details.nameAnalysis.hasCarBrand = true;
      result.details.nameAnalysis.matchedKeywords.push(...carBrands);
      result.score += 10; // Bonus por tener marca de auto
    } else if (hasAutomotiveKeyword) {
      // Si no tiene marca pero tiene palabra automotriz, dar bonus menor
      result.details.nameAnalysis.hasCarBrand = true; // Usar mismo campo para simplificar
      result.score += 5;
    }
    
    // Verificar palabras prohibidas (búsqueda exacta)
    const forbiddenKeywords = this.criteria.nameKeywords.forbidden.filter(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      return regex.test(nameLower);
    });
    
    if (forbiddenKeywords.length > 0) {
      result.details.nameAnalysis.hasForbiddenKeyword = true;
      result.details.nameAnalysis.matchedKeywords.push(...forbiddenKeywords);
      result.failureReasons.push(`Nombre contiene palabras prohibidas: ${forbiddenKeywords.join(', ')}`);
      result.score -= 20;
    }
    
    // Verificar marcas de motos
    const motorcycleBrands = this.criteria.nameKeywords.motorcycleBrands.filter(brand =>
      nameLower.includes(brand.toLowerCase())
    );
    
    if (motorcycleBrands.length > 0 && !result.details.nameAnalysis.hasCarBrand) {
      result.details.nameAnalysis.hasMotorcycleBrand = true;
      result.details.nameAnalysis.matchedKeywords.push(...motorcycleBrands);
      
      if (!this.criteria.features.includeMotorcycles) {
        result.failureReasons.push(`Negocio de motocicletas detectado: ${motorcycleBrands.join(', ')}`);
        result.score += this.criteria.scoring.motorcyclePenalty;
      }
    }
  }
  
  /**
   * Analiza el sitio web
   */
  private analyzeWebsite(website: string, result: EnhancedValidationResult): void {
    if (!this.criteria.features.validateWebsiteDomains) return;
    
    try {
      const url = new URL(website);
      const domain = url.hostname.toLowerCase().replace('www.', '');
      result.details.websiteAnalysis.domain = domain;
      
      // Verificar dominios prohibidos
      const isForbidden = this.criteria.websiteDomains.forbidden.some(forbidden =>
        domain === forbidden || domain.endsWith(`.${forbidden}`)
      );
      
      if (isForbidden) {
        result.details.websiteAnalysis.hasForbiddenDomain = true;
        result.failureReasons.push(`Dominio web prohibido: ${domain}`);
        result.score += this.criteria.scoring.forbiddenDomainPenalty;
      }
      
      // Ya no verificamos dominios "confiables" - cualquier dominio es válido
      // excepto los explícitamente prohibidos
    } catch (error) {
      console.warn(`Error analizando website ${website}:`, error);
    }
  }
  
  /**
   * Analiza las reseñas
   */
  private analyzeReviews(reviews: Review[], result: EnhancedValidationResult): void {
    const reviewTexts = reviews
      .filter(r => r.text && r.text.length > 20)
      .map(r => r.text.toLowerCase());
    
    if (reviewTexts.length === 0) return;
    
    result.details.reviewAnalysis.totalAnalyzed = reviewTexts.length;
    
    // Contar coincidencias por categoría
    const categoryMatches: Record<string, number> = {
      motorcycle: 0,
      rental: 0,
      serviceOnly: 0,
      fraud: 0
    };
    
    result.details.reviewAnalysis.matchedKeywords = {
      motorcycle: [],
      rental: [],
      serviceOnly: [],
      fraud: []
    };
    
    // Analizar cada reseña
    for (const reviewText of reviewTexts) {
      // Motocicletas
      const motorcycleMatches = this.criteria.reviewKeywords.motorcycle.filter(kw =>
        reviewText.includes(kw.toLowerCase())
      );
      if (motorcycleMatches.length > 0) {
        categoryMatches.motorcycle++;
        result.details.reviewAnalysis.matchedKeywords.motorcycle.push(...motorcycleMatches);
      }
      
      // Renta
      const rentalMatches = this.criteria.reviewKeywords.rental.filter(kw =>
        reviewText.includes(kw.toLowerCase())
      );
      if (rentalMatches.length > 0) {
        categoryMatches.rental++;
        result.details.reviewAnalysis.matchedKeywords.rental.push(...rentalMatches);
      }
      
      // Solo servicio
      const serviceOnlyMatches = this.criteria.reviewKeywords.serviceOnly.filter(kw =>
        reviewText.includes(kw.toLowerCase())
      );
      if (serviceOnlyMatches.length > 0) {
        categoryMatches.serviceOnly++;
        result.details.reviewAnalysis.matchedKeywords.serviceOnly.push(...serviceOnlyMatches);
      }
      
      // Fraude
      const fraudMatches = this.criteria.reviewKeywords.fraudIndicators.filter(kw =>
        reviewText.includes(kw.toLowerCase())
      );
      if (fraudMatches.length > 0) {
        categoryMatches.fraud++;
        result.details.reviewAnalysis.matchedKeywords.fraud.push(...fraudMatches);
      }
    }
    
    // Calcular ratios
    const total = reviewTexts.length;
    result.details.reviewAnalysis.motorcycleReviewRatio = categoryMatches.motorcycle / total;
    result.details.reviewAnalysis.rentalReviewRatio = categoryMatches.rental / total;
    result.details.reviewAnalysis.serviceOnlyReviewRatio = categoryMatches.serviceOnly / total;
    result.details.reviewAnalysis.fraudReviewRatio = categoryMatches.fraud / total;
    
    // Aplicar penalizaciones según umbrales
    if (result.details.reviewAnalysis.motorcycleReviewRatio >= this.criteria.thresholds.motorcycleKeywordThreshold) {
      if (!this.criteria.features.includeMotorcycles) {
        result.failureReasons.push(`${(result.details.reviewAnalysis.motorcycleReviewRatio * 100).toFixed(0)}% de reseñas mencionan motocicletas`);
        result.score += this.criteria.scoring.motorcyclePenalty;
      }
    }
    
    if (result.details.reviewAnalysis.rentalReviewRatio >= this.criteria.thresholds.rentalKeywordThreshold) {
      if (!this.criteria.features.includeRentals) {
        result.failureReasons.push(`${(result.details.reviewAnalysis.rentalReviewRatio * 100).toFixed(0)}% de reseñas mencionan renta`);
        result.score += this.criteria.scoring.rentalPenalty;
      }
    }
    
    if (result.details.reviewAnalysis.serviceOnlyReviewRatio >= this.criteria.thresholds.serviceOnlyThreshold) {
      if (!this.criteria.features.includeServiceOnly) {
        result.failureReasons.push(`${(result.details.reviewAnalysis.serviceOnlyReviewRatio * 100).toFixed(0)}% de reseñas indican solo servicio`);
        result.score += this.criteria.scoring.serviceOnlyPenalty;
      }
    }
    
    if (result.details.reviewAnalysis.fraudReviewRatio >= this.criteria.thresholds.fraudKeywordThreshold) {
      result.failureReasons.push(`${(result.details.reviewAnalysis.fraudReviewRatio * 100).toFixed(0)}% de reseñas reportan problemas`);
      result.score += this.criteria.scoring.fraudKeywordPenalty;
    }
  }
  
  /**
   * Calcula el score final y determina validez
   */
  private calculateFinalScore(agency: Agency, result: EnhancedValidationResult): void {
    // Bonus por rating
    if (agency.rating) {
      result.score += agency.rating * this.criteria.scoring.ratingMultiplier;
    }
    
    // Bonus por cantidad de reseñas
    const ratingsTotal = (agency as any).user_ratings_total || agency.reviewCount;
    if (ratingsTotal) {
      const reviewBonus = this.calculateReviewCountBonus(ratingsTotal);
      result.score += reviewBonus;
    }
    
    // Determinar si es confiable
    const isTrusted = agency.rating && agency.rating >= this.criteria.thresholds.minRatingForTrusted &&
                     ratingsTotal && ratingsTotal >= this.criteria.thresholds.minReviewsForTrusted;
    
    if (isTrusted) {
      result.score += 10; // Bonus adicional por ser altamente confiable
    }
    
    // Calcular confianza (0-100)
    result.confidence = Math.max(0, Math.min(100, result.score));
    
    // Determinar validez - Las reviews son más importantes que los tipos
    const hasAutomotiveReviews = result.details.reviewAnalysis.totalAnalyzed > 0 &&
      (result.details.reviewAnalysis.motorcycleReviewRatio < 0.3 &&
       result.details.reviewAnalysis.rentalReviewRatio < 0.3 &&
       result.details.reviewAnalysis.serviceOnlyReviewRatio < 0.3);
    
    const hasStrongAutomotiveSignals = 
      result.details.nameAnalysis.hasCarBrand ||
      hasAutomotiveReviews ||
      result.details.typeAnalysis.hasValidType;
    
    // Si tiene señales automotrices fuertes, solo validar score
    if (hasStrongAutomotiveSignals) {
      result.isValid = result.score >= 40;
    } else {
      // Sin señales fuertes, ser más estricto
      result.isValid = result.score >= 50 && result.failureReasons.filter(r => 
        !r.includes('No tiene tipos de negocio automotriz reconocidos')
      ).length === 0;
    }
    
    // Generar razón final
    if (result.isValid) {
      result.reason = `Agencia automotriz válida (confianza: ${result.confidence}%)`;
    } else {
      result.reason = result.failureReasons.join('; ');
    }
  }
  
  /**
   * Calcula bonus por cantidad de reseñas
   */
  private calculateReviewCountBonus(reviewCount: number): number {
    const { min, max, maxBonus } = this.criteria.scoring.reviewCountBonus;
    
    if (reviewCount <= min) return 0;
    if (reviewCount >= max) return maxBonus;
    
    // Interpolación lineal
    const ratio = (reviewCount - min) / (max - min);
    return Math.round(ratio * maxBonus);
  }
  
  /**
   * Recarga la configuración (útil para desarrollo)
   */
  public reloadConfiguration(): void {
    this.criteria = loadFilteringCriteria(true);
  }
  
  /**
   * Configura temporalmente si incluir motocicletas
   */
  public setIncludeMotorcycles(include: boolean): void {
    this.criteria.features.includeMotorcycles = include;
  }
  
  /**
   * Obtiene el estado actual de incluir motocicletas
   */
  public getIncludeMotorcycles(): boolean {
    return this.criteria.features.includeMotorcycles;
  }
  
  /**
   * Calcula score final basándose SOLO en reseñas
   */
  private calculateFinalScoreFromReviews(agency: Agency, result: EnhancedValidationResult): void {
    const analysis = result.details.reviewAnalysis;
    
    // Score base por tener reseñas analizadas
    result.score = 70;
    
    // Penalizaciones por contenido no automotriz
    if (analysis.motorcycleReviewRatio > 0.5) {
      result.score -= 40;
      result.failureReasons.push('Mayoría de reseñas sobre motocicletas');
    } else if (analysis.motorcycleReviewRatio > 0.3) {
      result.score -= 20;
    }
    
    if (analysis.rentalReviewRatio > 0.5) {
      result.score -= 40;
      result.failureReasons.push('Mayoría de reseñas sobre renta');
    } else if (analysis.rentalReviewRatio > 0.3) {
      result.score -= 20;
    }
    
    if (analysis.serviceOnlyReviewRatio > 0.5) {
      result.score -= 30;
      result.failureReasons.push('Mayoría indica solo servicio/taller');
    } else if (analysis.serviceOnlyReviewRatio > 0.3) {
      result.score -= 15;
    }
    
    // Penalización por fraude
    if (analysis.fraudReviewRatio > 0.2) {
      result.score -= 30;
      result.failureReasons.push('Múltiples reseñas mencionan fraude');
    } else if (analysis.fraudReviewRatio > 0.1) {
      result.score -= 15;
    }
    
    // Bonus por rating alto
    if (agency.rating && agency.rating >= 4.5) {
      result.score += 10;
    } else if (agency.rating && agency.rating >= 4.0) {
      result.score += 5;
    }
    
    // Bonus por muchas reseñas
    const reviewCount = agency.totalReviews || 0;
    if (reviewCount >= 100) {
      result.score += 10;
    } else if (reviewCount >= 50) {
      result.score += 5;
    }
    
    // Calcular confianza final
    result.confidence = Math.max(0, Math.min(100, result.score));
    
    // Determinar validez: es válido si no es mayormente motos/renta/servicio
    const isMainlyNonAutomotive = 
      analysis.motorcycleReviewRatio > 0.5 ||
      analysis.rentalReviewRatio > 0.5 ||
      analysis.serviceOnlyReviewRatio > 0.5;
    
    result.isValid = !isMainlyNonAutomotive && result.confidence >= 40;
    
    // Generar razón
    if (result.isValid) {
      result.reason = `Agencia automotriz válida basada en reseñas (confianza: ${result.confidence}%)`;
    } else if (result.failureReasons.length > 0) {
      result.reason = result.failureReasons.join('; ');
    } else {
      result.reason = `Confianza insuficiente basada en reseñas (${result.confidence}%)`;
    }
  }
}