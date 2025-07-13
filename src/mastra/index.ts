/**
 * @fileoverview Punto de entrada principal para la integración de Mastra
 * @module mastra
 * 
 * Este módulo configura y exporta la instancia principal de Mastra
 * con todos los agentes, herramientas y workflows registrados.
 * 
 * @example
 * ```typescript
 * import { mastra } from '@/src/mastra';
 * 
 * // Obtener un agente
 * const agent = mastra.getAgent('karmaticAssistant');
 * 
 * // Generar respuesta
 * const response = await agent.generate('Hola, ¿cómo estás?');
 * ```
 */

import { Mastra } from "@mastra/core/mastra";
import { karmaticAssistant } from "./agents/karmatic-assistant";

/**
 * Instancia principal de Mastra configurada con todos los componentes
 * 
 * @remarks
 * Esta instancia está preconfigurada con:
 * - Agentes: karmaticAssistant
 * - Herramientas: (por implementar)
 * - Workflows: (por implementar)
 * 
 * Para agregar nuevos agentes, importarlos y agregarlos al objeto agents.
 */
export const mastra = new Mastra({
  agents: { 
    karmaticAssistant 
  }
  // TODO: Agregar tools cuando se implementen
  // tools: { ... }
  
  // TODO: Agregar workflows cuando se implementen
  // workflows: { ... }
});

// Exportar la instancia para usar en la app
export default mastra;