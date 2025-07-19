/**
 * @fileoverview Tool para analizar la intención del query como asesor automotriz experto
 * @module mastra/tools/analyze-query-intent
 * 
 * Reemplaza al query-parser con análisis inteligente usando Kimi K2.
 * Actúa como un asesor automotriz experto que conoce todos los modelos,
 * precios, competidores y puede guiar el análisis posterior.
 */

import { createTool } from '@mastra/core'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

// Configurar OpenRouter para Kimi K2
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
})

/**
 * Schema de entrada - Query y país
 */
const inputSchema = z.object({
  query: z.string().describe('Búsqueda del usuario (puede ser específica o general)'),
  country: z.string().length(2).default('MX').describe('Código ISO del país (MX, CO, AR, CL, etc.)')
})

/**
 * Schema del vehículo identificado
 */
const vehicleSchema = z.object({
  identified: z.boolean().describe('Si se identificó un modelo específico'),
  make: z.string().optional().describe('Marca del vehículo (ej: Mazda, Toyota)'),
  model: z.string().optional().describe('Modelo específico (ej: MX-5, Corolla)'),
  type: z.string().describe('Tipo de vehículo (Roadster, SUV familiar, Sedán compacto, etc.)'),
  segment: z.string().describe('Segmento de mercado (Deportivo, Familiar, Económico, Premium, etc.)')
})

/**
 * Schema de insights del mercado local
 */
const marketInsightsSchema = z.object({
  availability: z.enum(['common', 'limited', 'rare', 'not_available']).describe('Disponibilidad en el país'),
  popularityRank: z.number().optional().describe('Ranking de popularidad (1-100)'),
  localConsiderations: z.array(z.string()).describe('Consideraciones específicas del mercado local')
})

/**
 * Schema de precios
 */
const pricingSchema = z.object({
  currency: z.string().describe('Moneda local (MXN, COP, ARS, CLP)'),
  new: z.object({
    starting: z.number().describe('Precio inicial en moneda local'),
    range: z.string().describe('Rango de precios (ej: "615-700 mil MXN")')
  }).optional(),
  used: z.object({
    sweetSpot: z.object({
      years: z.string().describe('Años recomendados (ej: "2020-2022")'),
      price: z.number().describe('Precio promedio recomendado'),
      reason: z.string().describe('Por qué es la mejor opción')
    })
  }).optional()
})

/**
 * Schema de alternativas
 */
const alternativesSchema = z.object({
  direct: z.array(z.object({
    model: z.string().describe('Modelo competidor'),
    priceComparison: z.string().describe('Comparación de precio'),
    localAdvantage: z.string().describe('Ventaja en el mercado local')
  })).describe('Competidores directos'),
  
  localFavorites: z.array(z.object({
    model: z.string().describe('Modelo popular localmente'),
    reason: z.string().describe('Por qué es favorito en el país')
  })).optional().describe('Favoritos locales no globales')
})

/**
 * Schema de estrategia de análisis
 */
const analysisStrategySchema = z.object({
  inventorySearch: z.object({
    primaryTargets: z.array(z.string()).describe('Modelos principales a buscar'),
    secondaryTargets: z.array(z.string()).optional().describe('Alternativas si no hay principales'),
    yearRange: z.string().optional().describe('Rango de años recomendado'),
    condition: z.enum(['new', 'used', 'both']).describe('Condición preferida'),
    countryTips: z.array(z.string()).describe('Tips específicos del país')
  }),
  
  reviewFocus: z.array(z.string()).describe('Aspectos clave a buscar en reviews'),
  
  dealerPriorities: z.object({
    preferred: z.array(z.string()).describe('Tipos de agencia preferidos'),
    avoid: z.array(z.string()).optional().describe('Tipos de agencia a evitar')
  })
})

/**
 * Schema de salida completo - Asesor Automotriz Experto
 */
const outputSchema = z.object({
  metadata: z.object({
    country: z.string(),
    currency: z.string(),
    marketName: z.string(),
    analysisDate: z.string()
  }).describe('Metadatos del análisis'),
  
  vehicle: vehicleSchema.describe('Vehículo identificado o tipo buscado'),
  
  marketInsights: marketInsightsSchema.describe('Insights del mercado local'),
  
  pricing: pricingSchema.describe('Información de precios en moneda local'),
  
  specifications: z.object({
    fuelEconomy: z.string().optional().describe('Consumo de combustible'),
    powerTrain: z.string().optional().describe('Motor y transmisión'),
    capacity: z.string().optional().describe('Capacidad de pasajeros'),
    keyFeatures: z.array(z.string()).optional().describe('Características principales')
  }).optional().describe('Especificaciones técnicas si se identificó modelo'),
  
  alternatives: alternativesSchema.describe('Competidores y alternativas'),
  
  analysisStrategy: analysisStrategySchema.describe('Estrategia para análisis posterior')
})

/**
 * Contexto por país para el asesor
 */
const COUNTRY_CONTEXT = {
  'MX': {
    name: 'México',
    currency: 'MXN',
    preferences: 'SUVs y pickups populares, financiamiento muy importante',
    regulations: 'Verificación vehicular obligatoria, cuidado con autos chocolate',
    tips: 'Preferir agencias establecidas, verificar factura y papeles',
    marketNotes: 'Mercado grande con buena disponibilidad de marcas principales'
  },
  'CO': {
    name: 'Colombia',
    currency: 'COP',
    preferences: 'Sedanes pequeños populares, economía de combustible crítica',
    regulations: 'Restricciones por placa (pico y placa), SOAT obligatorio',
    tips: 'Revisar SOAT y revisión técnico-mecánica al día',
    marketNotes: 'Impuestos altos en importados, preferir ensamblados localmente'
  },
  'AR': {
    name: 'Argentina',
    currency: 'ARS',
    preferences: 'Autos nacionales tienen ventajas fiscales significativas',
    regulations: 'Alta carga impositiva en importados, patentamiento caro',
    tips: 'Considerar inflación en precios usados, preferir producción nacional',
    marketNotes: 'Mercado volátil, precios cambian rápidamente'
  },
  'CL': {
    name: 'Chile',
    currency: 'CLP',
    preferences: 'City cars populares por congestión, buenos caminos permiten variedad',
    regulations: 'Normas de emisión Euro 6, revisión técnica estricta',
    tips: 'Mercado más estable de la región, buena reventa',
    marketNotes: 'Amplia variedad de marcas, incluyendo chinas'
  }
}

/**
 * Herramienta analyzeQueryIntent
 * 
 * Analiza la intención del usuario actuando como asesor automotriz experto.
 * Provee conocimiento profundo sobre modelos, precios, alternativas y
 * guía específica para orientar el análisis posterior.
 * 
 * @example
 * const intent = await analyzeQueryIntent({
 *   query: "mazda mx5",
 *   country: "MX"
 * })
 */
export const analyzeQueryIntent = createTool({
  id: 'analyze_query_intent',
  description: 'Analiza la intención del query como asesor automotriz experto',
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    const { query, country } = context
    console.log('🧠 analyzeQueryIntent: Analizando query', { query, country })
    
    try {
      // Obtener contexto del país
      const countryContext = COUNTRY_CONTEXT[country as keyof typeof COUNTRY_CONTEXT] || COUNTRY_CONTEXT['MX']
      
      // Crear prompt para el asesor experto
      const systemPrompt = `Eres un asesor automotriz experto en ${countryContext.name} con conocimiento profundo y actualizado del mercado automotriz.

CONTEXTO DEL PAÍS:
- Moneda: ${countryContext.currency}
- Preferencias del mercado: ${countryContext.preferences}
- Regulaciones importantes: ${countryContext.regulations}
- Tips locales: ${countryContext.tips}
- Notas del mercado: ${countryContext.marketNotes}

Tu misión es analizar el query del usuario y proveer:
1. Identificación exacta del vehículo si lo mencionó
2. Especificaciones técnicas y características principales
3. Precios actualizados en ${countryContext.currency} para 2025
4. Disponibilidad real en ${countryContext.name}
5. Competidores directos con comparación de precios
6. Alternativas inteligentes según diferentes necesidades
7. Estrategia específica para buscar en agencias
8. Qué aspectos revisar en las reseñas
9. Consideraciones regulatorias y tips del país

Si el query es general (ej: "auto familiar"), identifica la categoría y sugiere los 3 mejores modelos para ${countryContext.name}.

IMPORTANTE:
- Precios siempre en ${countryContext.currency} sin conversiones
- Solo modelos vendidos oficialmente en ${countryContext.name}
- Considera las preferencias culturales locales
- Incluye tips específicos del mercado ${countryContext.name}
- Sé específico con años y versiones disponibles`

      const userPrompt = `Analiza esta búsqueda: "${query}"

IMPORTANTE: Si la búsqueda NO está relacionada con automóviles, agencias automotrices, o vehículos:
- Marca vehicle.identified = false
- Establece vehicle.type = "No automotriz"
- En analysisStrategy.inventorySearch.primaryTargets = ["Agencias automotrices generales"]
- En marketInsights.localConsiderations incluye: ["Búsqueda no relacionada con vehículos"]

De lo contrario, proporciona un análisis completo como asesor experto.
Si el usuario busca algo específico automotriz, da información detallada.
Si es una búsqueda general automotriz, sugiere las mejores opciones.`

      // Generar análisis con Kimi K2
      const result = await generateObject({
        model: openrouter('moonshotai/kimi-k2'),
        schema: outputSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3, // Más determinístico para datos técnicos
        maxTokens: 2000,
      })

      // Agregar metadatos
      const analysis = {
        ...result.object,
        metadata: {
          country,
          currency: countryContext.currency,
          marketName: countryContext.name,
          analysisDate: new Date().toISOString()
        }
      }

      console.log('✅ analyzeQueryIntent: Análisis completado', {
        vehicleIdentified: analysis.vehicle.identified,
        alternatives: analysis.alternatives.direct.length,
        country: countryContext.name
      })

      return analysis

    } catch (error) {
      console.error('❌ analyzeQueryIntent: Error en análisis', error)
      
      // Fallback básico en caso de error
      return {
        metadata: {
          country,
          currency: COUNTRY_CONTEXT[country as keyof typeof COUNTRY_CONTEXT]?.currency || 'MXN',
          marketName: COUNTRY_CONTEXT[country as keyof typeof COUNTRY_CONTEXT]?.name || 'México',
          analysisDate: new Date().toISOString()
        },
        vehicle: {
          identified: false,
          type: 'General',
          segment: 'No especificado'
        },
        marketInsights: {
          availability: 'common' as const,
          localConsiderations: ['Búsqueda general, se recomienda especificar más']
        },
        pricing: {
          currency: COUNTRY_CONTEXT[country as keyof typeof COUNTRY_CONTEXT]?.currency || 'MXN'
        },
        alternatives: {
          direct: [],
          localFavorites: []
        },
        analysisStrategy: {
          inventorySearch: {
            primaryTargets: ['Agencias automotrices'],
            condition: 'both' as const,
            countryTips: ['Buscar agencias con buena reputación']
          },
          reviewFocus: ['Servicio al cliente', 'Honestidad', 'Precios justos'],
          dealerPriorities: {
            preferred: ['Agencias establecidas', 'Distribuidores oficiales']
          }
        }
      }
    }
  }
})