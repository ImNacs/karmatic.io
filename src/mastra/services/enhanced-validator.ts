/**
 * Validador de agencias automotrices usando la tool de Mastra
 * Sistema simplificado basado 100% en análisis de reseñas con IA
 */

import { Agency, Review } from '../types';
import { ANALYSIS_CONFIG } from '../config/analysis.config';
import { validateAgency, validateAgencyOutputSchema } from '../tools/validate-agency';
import { z } from 'zod';

/**
 * Resultado de validación
 */
export interface EnhancedValidationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  failureReasons: string[];
  score: number;
  details: {
    reviewAnalysis: {
      totalAnalyzed: number;
      category?: string;
    };
  };
}

/**
 * Valida agencias automotrices usando la tool de validación
 */
export class EnhancedAgencyValidator {
  
  /**
   * Valida una agencia usando la tool de IA
   */
  public async validateAgency(agency: Agency, reviews: Review[] = []): Promise<EnhancedValidationResult> {
    const result: EnhancedValidationResult = {
      isValid: true,
      confidence: 50,
      reason: '',
      failureReasons: [],
      score: 50,
      details: {
        reviewAnalysis: {
          totalAnalyzed: 0
        }
      }
    };
    
    try {
      // Verificar que la tool esté disponible
      if (!validateAgency.execute) {
        throw new Error('Tool validateAgency no está disponible');
      }
      
      // Preparar datos para la tool
      const toolInput = {
        agencyName: agency.name,
        placeId: agency.placeId,
        rating: agency.rating,
        totalReviews: agency.totalReviews,
        reviews: reviews.slice(0, ANALYSIS_CONFIG.validation.reviewsToAnalyze).map(r => ({
          text: r.text,
          rating: r.rating,
          timeCreated: r.date
        }))
      };
      
      // Llamar a la tool de validación
      const validationResult = await (validateAgency as any).execute({
        context: toolInput
      }) as z.infer<typeof validateAgencyOutputSchema>;
      
      // Mapear resultado de la tool
      result.isValid = validationResult.isAutomotiveAgency;
      result.confidence = validationResult.confidence;
      result.reason = validationResult.reason;
      
      if (!validationResult.isAutomotiveAgency) {
        result.failureReasons.push(validationResult.reason);
        if (validationResult.excludedCategories.length > 0) {
          result.failureReasons.push(`Categorías excluidas: ${validationResult.excludedCategories.join(', ')}`);
        }
      }
      
      // Calcular score basado en la confianza y el automotiveScore
      if (validationResult.isAutomotiveAgency) {
        result.score = Math.round(50 + (validationResult.automotiveScore / 2));
      } else {
        result.score = Math.round(validationResult.confidence / 2);
      }
      
      // Agregar detalles del análisis
      result.details.reviewAnalysis.totalAnalyzed = reviews.length;
      result.details.reviewAnalysis.category = validationResult.category;
      
      console.log(`🤖 Validación completada para ${agency.name}:`, {
        isValid: result.isValid,
        confidence: result.confidence,
        category: validationResult.category,
        automotiveScore: validationResult.automotiveScore
      });
      
    } catch (error) {
      console.error('Error en validación:', error);
      // En caso de error, dar beneficio de la duda
      result.confidence = 40;
      result.reason = 'Error en validación, asumiendo válido';
    }
    
    return result;
  }
}