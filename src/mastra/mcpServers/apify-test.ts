/**
 * @fileoverview Apify MCP server for testing (with env loaded)
 * @module mastra/mcpServers/apify-test
 */

import { MCPClient } from "@mastra/mcp";

// Get API token from environment
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

// Specific actors for car dealership searches
const AUTOMOTIVE_ACTORS = [
  'compass/google-maps-extractor',              // Main Google Maps scraper
];

// Log configuration status
if (!APIFY_TOKEN) {
  console.warn('⚠️ APIFY_API_TOKEN not configured - Apify MCP features will be disabled');
  console.warn('💡 Get your token at: https://console.apify.com/account/integrations');
} else {
  console.log('✅ APIFY_API_TOKEN loaded successfully');
}

/**
 * Apify MCP client instance for testing
 */
export const apifyMcpServerTest = APIFY_TOKEN ? new MCPClient({
  servers: {
    apify: {
      url: new URL(`https://mcp.apify.com/sse?actors=${AUTOMOTIVE_ACTORS.join(',')}`),
      requestInit: {
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
          'X-Source': 'karmatic-backend-test',
          'User-Agent': 'Karmatic/1.0'
        }
      }
    }
  }
}) : null;

/**
 * Get list of available Apify tools
 */
export async function listApifyToolsTest() {
  if (!apifyMcpServerTest) {
    console.log('❌ Apify MCP not configured');
    return null;
  }

  try {
    console.log('🔍 Fetching Apify tools...');
    const tools = await apifyMcpServerTest.getTools();
    const toolNames = Object.keys(tools);
    
    console.log(`✅ ${toolNames.length} Apify tools available`);
    console.log('📋 Tools:', toolNames);
    
    return tools;
  } catch (error) {
    console.error('❌ Error connecting to Apify MCP:', error);
    return null;
  }
}