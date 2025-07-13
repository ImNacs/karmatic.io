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
import { karmaticTools } from "./tools";
import { karmaticWorkflows } from "./workflows";

/**
 * Instancia principal de Mastra configurada con todos los componentes
 * 
 * @remarks
 * Esta instancia está preconfigurada con:
 * - Agentes: karmaticAssistant (con memory y tools integrados)
 * - Herramientas: searchDealerships, analyzeDealership, getVehicleInventory, etc.
 * - Workflows: vehicleSearchWorkflow, dealershipAnalysisWorkflow, recommendationWorkflow
 * 
 * Para agregar nuevos agentes, importarlos y agregarlos al objeto agents.
 */
export const mastra = new Mastra({
  agents: { 
    karmaticAssistant 
  },
  tools: karmaticTools,
  workflows: karmaticWorkflows,
});

// Exportar la instancia para usar en la app
export default mastra;