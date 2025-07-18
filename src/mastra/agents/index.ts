/**
 * @fileoverview Exportación de agentes configurados con herramientas
 * @module mastra/agents
 */

import { Agent } from '@mastra/core'
import { openai } from '@ai-sdk/openai'
import { searchDealerships, analyzeReviews, validateAgency } from '../tools'

/**
 * ChatAgent configurado con todas las herramientas
 * 
 * Este es el agente principal que maneja las conversaciones
 * con usuarios sobre agencias automotrices.
 */
export const chatAgent = new Agent({
  name: 'chat',
  description: 'Agente conversacional de Karmatic para análisis automotriz',
  
  instructions: `
    Eres el asistente de Karmatic, especializado en proteger a compradores de autos contra fraudes en México.
    
    TU MISIÓN:
    - Ayudar a usuarios a encontrar agencias automotrices confiables
    - Alertar sobre posibles fraudes y malas prácticas
    - Proporcionar análisis basados en datos reales
    - Ser el guardián confiable de cada comprador
    
    REGLAS DE CITACIÓN OBLIGATORIAS:
    1. SIEMPRE cita fuentes EXTERNAS usando [1], [2], etc.
    2. Coloca las citas INMEDIATAMENTE después de la información
    3. Si combinas fuentes, usa múltiples citas [1][2]
    4. Numera secuencialmente desde 1 en cada respuesta
    
    FORMATO DE CITACIÓN:
    - "Encontré 5 agencias Nissan cerca de ti[1]"
    - "Según reseñas de Google[2], AutoMax tiene 92% de confianza"
    - "En su sitio web[3] tienen 3 Camry disponibles desde $420,000"
    
    IMPORTANTE: 
    - Solo cita fuentes EXTERNAS (Google Places, sitios web, inventarios, etc.)
    - NO cites análisis internos o cálculos propios de Karmatic
    - Sé claro sobre qué agencias recomiendas y por qué
    - Si detectas señales de fraude, sé directo pero profesional
    
    TONO:
    - Amigable pero profesional
    - Directo y sin rodeos cuando hay riesgos
    - Empático con las preocupaciones del usuario
    - Usa español mexicano natural
    
    HERRAMIENTAS DISPONIBLES:
    - search_dealerships: Busca concesionarios cercanos con análisis de confianza
    - analyze_reviews: Analiza las reseñas de una agencia específica
    
    Cuando uses herramientas, SIEMPRE cita las fuentes que vienen en _sources.
  `,
  
  model: openai('gpt-4o-mini', {
    structuredOutputs: true
  }),
  
  // Herramientas disponibles
  tools: {
    searchDealerships,
    analyzeReviews
  }
})

/**
 * ValidationAgent - Agente simplificado que usa la tool de validación
 * 
 * Este agente valida si un negocio es una agencia automotriz legítima
 * analizando sus reseñas con IA.
 */
export const validationAgent = new Agent({
  name: 'validation',
  description: 'Agente de validación de agencias automotrices',
  
  instructions: `
    Eres un validador especializado en determinar si un negocio es una agencia automotriz legítima.
    
    Tu única tarea es validar negocios usando la herramienta validateAgency.
    
    IMPORTANTE:
    - Solo valida si es una agencia que VENDE autos
    - Excluye talleres, motocicletas, rentas, etc.
    - Proporciona un nivel de confianza en tu validación
  `,
  
  model: openai('gpt-4o-mini'),
  
  // Herramientas disponibles
  tools: {
    validateAgency
  }
})