/**
 * @fileoverview Mastra instance configuration
 * @module mastra
 */

import { Mastra } from "@mastra/core";
import { chatAgent } from "./agents";

/**
 * Inicializar instancia de Mastra con agentes
 * Nota: Usando APIs directas en lugar de MCP para mayor estabilidad
 */
export const mastra = new Mastra({
  // Registrar agentes
  agents: {
    chat: chatAgent
  }
});

console.log('✅ Mastra inicializado con agente de chat');

export default mastra;