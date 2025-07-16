/**
 * @fileoverview Mastra instance configuration
 * @module mastra
 */

import { Mastra } from "@mastra/core";
import { apifyMcpServer } from "./mcpServers/apify";

/**
 * Initialize Mastra instance with minimal configuration
 * Temporarily disabled agents until new implementation
 */
export const mastra = new Mastra({
  // Register MCP servers if available
  ...(apifyMcpServer && {
    mcpServers: {
      apify: apifyMcpServer
    }
  })
});

// Log MCP configuration status
if (apifyMcpServer) {
  console.log('✅ Apify MCP server registered with Mastra');
} else {
  console.log('ℹ️ Apify MCP server not configured (no API token)');
}

export default mastra;