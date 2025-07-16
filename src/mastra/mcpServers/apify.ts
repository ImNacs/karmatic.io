/**
 * @fileoverview Apify MCP server configuration
 * @module mastra/mcpServers/apify
 */

import { MCPClient } from "@mastra/mcp";

// Get API token from environment
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

// Specific actors for car dealership searches
const AUTOMOTIVE_ACTORS = [
  'compass/google-maps-reviews-scraper',        // Google Maps Reviews scraper (1000s reviews)
  'compass/google-maps-extractor',              // Google Maps places data
];

// Log configuration status
if (!APIFY_TOKEN) {
  console.warn('⚠️ APIFY_API_TOKEN not configured - Apify MCP features will be disabled');
  console.warn('💡 Get your token at: https://console.apify.com/account/integrations');
}

/**
 * Apify MCP client instance
 * Configured to connect via SSE with pre-loaded automotive actors
 */
export const apifyMcpServer = APIFY_TOKEN ? new MCPClient({
  servers: {
    apify: {
      url: new URL(`https://mcp.apify.com/sse?actors=${AUTOMOTIVE_ACTORS.join(',')}`),
      requestInit: {
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
          'X-Source': 'karmatic-backend',
          'User-Agent': 'Karmatic/1.0'
        }
      }
    }
  }
}) : null;

/**
 * Check if Apify MCP is available
 */
export const isApifyAvailable = (): boolean => {
  return !!APIFY_TOKEN && !!apifyMcpServer;
};

/**
 * Get list of available Apify tools
 * Used for debugging and validation
 */
export async function listApifyTools() {
  if (!apifyMcpServer) {
    console.log('❌ Apify MCP not configured');
    return null;
  }

  try {
    console.log('🔍 Fetching Apify tools...');
    const tools = await apifyMcpServer.getTools();
    const toolNames = Object.keys(tools);
    
    console.log(`✅ ${toolNames.length} Apify tools available`);
    console.log('📋 Tools:', toolNames);
    
    return tools;
  } catch (error) {
    console.error('❌ Error connecting to Apify MCP:', error);
    return null;
  }
}

/**
 * Disconnect from Apify MCP server
 * Call this when shutting down the application
 */
export async function disconnectApify() {
  if (apifyMcpServer) {
    try {
      await apifyMcpServer.disconnect();
      console.log('👋 Disconnected from Apify MCP');
    } catch (error) {
      console.error('❌ Error disconnecting from Apify:', error);
    }
  }
}