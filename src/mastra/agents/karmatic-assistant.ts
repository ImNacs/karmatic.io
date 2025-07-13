/**
 * @fileoverview Agente AI principal de Karmatic para asistencia automotriz
 * @module mastra/agents
 */

import { Agent } from "@mastra/core/agent";
import { getDefaultModel, getModel } from "../config/llm-providers";

/**
 * Instrucciones del sistema para el asistente de Karmatic
 * Define el comportamiento, tono y capacidades del agente
 */
const SYSTEM_INSTRUCTIONS = `
Eres un experto asistente AI para Karmatic, una plataforma de descubrimiento de agencias automotrices.
Tu objetivo es ayudar a los usuarios a encontrar el mejor concesionario o agencia para sus necesidades.

## Personalidad y Tono
- Profesional pero amigable
- Proactivo en ofrecer información relevante
- Experto en el mercado automotriz
- Orientado a resolver problemas del usuario

## Capacidades
1. **Análisis de Concesionarios**: Evalúa y compara agencias basándote en:
   - Calificaciones y reseñas
   - Inventario disponible
   - Servicios ofrecidos
   - Ubicación y horarios
   - Especialización en marcas

2. **Asesoría Financiera**: Ayuda con:
   - Cálculos de pagos mensuales
   - Comparación de tasas de interés
   - Opciones de financiamiento
   - Requisitos de crédito

3. **Recomendaciones Personalizadas**: Basadas en:
   - Presupuesto del usuario
   - Preferencias de marca/modelo
   - Ubicación y distancia
   - Necesidades específicas

## Formato de Respuestas
- Usa markdown para estructurar respuestas
- Incluye emojis relevantes para hacer la conversación más amigable
- Proporciona datos concretos cuando sea posible
- Ofrece siempre próximos pasos o acciones sugeridas

## Contexto
Cuando recibas información sobre la búsqueda actual del usuario (ubicación, resultados), úsala para personalizar tus respuestas.
`;

/**
 * Crea una instancia del agente Karmatic Assistant
 * 
 * @param modelName - Nombre del modelo a usar (opcional)
 * @returns Instancia configurada del agente
 * 
 * @example
 * ```typescript
 * // Usar modelo por defecto
 * const agent = createKarmaticAssistant();
 * 
 * // Usar modelo específico
 * const agent = createKarmaticAssistant('gpt-4o');
 * ```
 */
export function createKarmaticAssistant(modelName?: string) {
  const model = modelName ? getModel(modelName) : getDefaultModel();
  
  return new Agent({
    name: "Karmatic Assistant",
    description: "Asistente AI experto en búsqueda y análisis de agencias automotrices",
    instructions: SYSTEM_INSTRUCTIONS,
    model,
    // Temperatura moderada para balance entre creatividad y precisión
    temperature: 0.7,
    // Configuración adicional
    // maxTokens: 2000, // Comentado para usar el default del modelo
  });
}

/**
 * Instancia por defecto del agente Karmatic Assistant
 * Usa el modelo configurado por defecto en las variables de entorno
 */
export const karmaticAssistant = createKarmaticAssistant();

/**
 * Tipos de contexto que el agente puede recibir
 */
export interface AgentContext {
  /** Ubicación de la búsqueda */
  location?: string;
  /** Query original del usuario */
  query?: string;
  /** Resultados de búsqueda disponibles */
  results?: Array<{
    name: string;
    rating: number;
    address: string;
    types?: string[];
    priceLevel?: number;
  }>;
  /** ID de la búsqueda actual */
  searchId?: string;
  /** Información del usuario */
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

/**
 * Prepara el contexto para incluir en el mensaje del agente
 */
export function prepareContext(context?: AgentContext): string {
  if (!context) return "";
  
  const parts: string[] = [];
  
  if (context.location) {
    parts.push(`Ubicación de búsqueda: ${context.location}`);
  }
  
  if (context.query) {
    parts.push(`Búsqueda original: ${context.query}`);
  }
  
  if (context.results && context.results.length > 0) {
    parts.push(`\nResultados disponibles (${context.results.length} agencias):`);
    context.results.slice(0, 5).forEach((result, index) => {
      parts.push(`${index + 1}. ${result.name} - ⭐ ${result.rating}/5 - 📍 ${result.address}`);
    });
  }
  
  return parts.length > 0 ? `\n\nContexto actual:\n${parts.join('\n')}` : "";
}