/**
 * @fileoverview Tool para validar si un negocio es una agencia automotriz
 * @module mastra/tools/validate-agency
 * 
 * Valida usando IA si un negocio es una agencia de autos legítima
 * basándose en el análisis de sus reseñas.
 */

import { createTool } from '@mastra/core'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { ANALYSIS_CONFIG } from '../config/analysis.config'

// Cliente OpenRouter para DeepSeek
const openrouter = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  headers: {
    'HTTP-Referer': 'https://karmatic.io',
    'X-Title': 'Karmatic Validation Tool'
  }
})

/**
 * Schema de entrada
 */
const inputSchema = z.object({
  agencyName: z.string().describe('Nombre de la agencia a validar'),
  placeId: z.string().describe('ID de Google Places'),
  rating: z.number().optional().describe('Rating de Google'),
  totalReviews: z.number().optional().describe('Total de reseñas'),
  reviews: z.array(z.object({
    text: z.string().describe('Texto de la reseña'),
    rating: z.number().describe('Rating de la reseña'),
    timeCreated: z.string().optional().describe('Fecha de creación')
  })).describe('Reseñas a analizar')
})

/**
 * Schema de salida
 */
export const validateAgencyOutputSchema = z.object({
  isAutomotiveAgency: z.boolean().describe('Si es una agencia automotriz legítima'),
  confidence: z.number().min(0).max(100).describe('Nivel de confianza (0-100)'),
  category: z.enum(['agencia_autos', 'motocicletas', 'renta', 'taller', 'otro']).describe('Categoría del negocio'),
  reason: z.string().describe('Razón de la decisión'),
  automotiveScore: z.number().min(0).max(100).describe('Qué tan relacionado está con venta de autos'),
  excludedCategories: z.array(z.string()).describe('Categorías detectadas que fueron excluidas'),
  _source: z.literal('validation_analysis').default('validation_analysis')
})

/**
 * Tool de validación de agencias automotrices
 */
export const validateAgency = createTool({
  id: 'validate-agency',
  description: 'Valida si un negocio es una agencia automotriz legítima analizando sus reseñas',
  inputSchema,
  outputSchema: validateAgencyOutputSchema,
  
  execute: async ({ context }) => {
    const { agencyName, placeId, rating, totalReviews, reviews } = context;
    console.log(`🔍 Validando agencia: ${agencyName}`);
    
    // Validación rápida por nombre
    const quickResult = quickValidateByName(agencyName);
    if (quickResult) {
      console.log(`✅ Validación rápida: ${quickResult.reason}`);
      return {
        ...quickResult,
        _source: 'validation_analysis' as const
      };
    }
    
    // Si no hay suficientes reseñas, retornar con baja confianza
    if (reviews.length < ANALYSIS_CONFIG.validation.minReviewsForAnalysis) {
      console.log('⚠️ Pocas reseñas para validación confiable');
      return {
        isAutomotiveAgency: true,
        confidence: 30,
        category: 'otro',
        reason: `Insuficientes reseñas para validación confiable (mínimo ${ANALYSIS_CONFIG.validation.minReviewsForAnalysis})`,
        automotiveScore: 50,
        excludedCategories: [],
        _source: 'validation_analysis' as const
      };
    }
    
    // Construir prompt para la IA
    const reviewTexts = reviews
      .slice(0, ANALYSIS_CONFIG.validation.reviewsToAnalyze)
      .map((r, i) => `Reseña ${i + 1} (${r.rating}⭐): ${r.text}`)
      .join('\n\n');
    
    const prompt = `Analiza si "${agencyName}" es una agencia de autos legítima basándote en estas reseñas:

${reviewTexts}

CRITERIOS DE INCLUSIÓN (✅):
- Agencias que VENDEN autos nuevos o seminuevos
- Concesionarios oficiales de marcas
- Lotes de autos con venta directa
- Agencias multimarca con inventario propio

CRITERIOS DE EXCLUSIÓN (❌):
- Talleres mecánicos (solo servicio)
- Agencias de motocicletas
- Renta de autos o leasing
- Refaccionarias o autopartes
- Car wash o detallado
- Negocios no automotrices

Responde en formato JSON:
{
  "isAutomotiveAgency": boolean,
  "confidence": number (0-100),
  "category": "agencia_autos" | "motocicletas" | "renta" | "taller" | "otro",
  "reason": "explicación breve en español",
  "automotiveScore": number (0-100),
  "excludedCategories": ["categorías detectadas excluidas"]
}`;
    
    try {
      // Llamar a la IA
      const { text } = await generateText({
        model: openrouter('deepseek/deepseek-chat-v3-0324:free'),
        prompt,
        temperature: 0.1,
        maxTokens: 500
      });
      
      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      console.log(`✅ Validación completada: ${result.isAutomotiveAgency ? 'ES' : 'NO ES'} agencia automotriz (${result.confidence}% confianza)`);
      
      return {
        ...result,
        _source: 'validation_analysis' as const
      };
      
    } catch (error) {
      console.error('❌ Error en validación:', error);
      return {
        isAutomotiveAgency: true,
        confidence: 40,
        category: 'otro',
        reason: 'Error en validación, asumiendo válido',
        automotiveScore: 50,
        excludedCategories: [],
        _source: 'validation_analysis' as const
      };
    }
  }
})

/**
 * Validación rápida por nombre (sin IA)
 */
function quickValidateByName(name: string): Omit<z.infer<typeof validateAgencyOutputSchema>, '_source'> | null {
  const nameLower = name.toLowerCase();
  
  // Exclusiones obvias
  const exclusions = [
    { pattern: /\b(moto|motos|motocicleta|motocicletas)\b/i, category: 'motocicletas' as const },
    { pattern: /\brent\s*(a|de)?\s*(car|auto|autos)\b/i, category: 'renta' as const },
    { pattern: /\b(taller|mecánico|servicio|mecanica)\b/i, category: 'taller' as const },
    { pattern: /\b(refaccion|autopart|parts)\b/i, category: 'otro' as const },
    { pattern: /\b(car\s*wash|lavado|autolavado)\b/i, category: 'otro' as const }
  ];
  
  for (const exclusion of exclusions) {
    if (exclusion.pattern.test(nameLower)) {
      return {
        isAutomotiveAgency: false,
        confidence: 90,
        category: exclusion.category,
        reason: `Excluido por nombre: ${exclusion.category}`,
        automotiveScore: 0,
        excludedCategories: [exclusion.category]
      };
    }
  }
  
  // Inclusiones obvias
  const autoBrands = [
    'toyota', 'honda', 'nissan', 'mazda', 'ford', 'chevrolet',
    'volkswagen', 'hyundai', 'kia', 'bmw', 'mercedes', 'audi'
  ];
  
  const hasAutoBrand = autoBrands.some(brand => 
    nameLower.includes(brand) && 
    (nameLower.includes('agencia') || nameLower.includes('automotriz'))
  );
  
  if (hasAutoBrand) {
    return {
      isAutomotiveAgency: true,
      confidence: 85,
      category: 'agencia_autos',
      reason: 'Agencia de marca automotriz reconocida',
      automotiveScore: 95,
      excludedCategories: []
    };
  }
  
  return null;
}