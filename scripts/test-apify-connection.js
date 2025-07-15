/**
 * Test script for Apify MCP connection
 * Run with: node scripts/test-apify-connection.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing Apify MCP connection...\n');
  
  // Check if token is configured
  const hasToken = !!process.env.APIFY_API_TOKEN;
  console.log(`📋 APIFY_API_TOKEN configured: ${hasToken ? '✅ Yes' : '❌ No'}`);
  
  if (!hasToken) {
    console.log('\n⚠️  To enable Apify integration:');
    console.log('1. Get your API token from: https://console.apify.com/account/integrations');
    console.log('2. Add to .env.local: APIFY_API_TOKEN=apify_api_YOUR_TOKEN_HERE');
    console.log('3. Restart the application\n');
    return;
  }

  try {
    // Import the module
    const { listApifyTools, isApifyAvailable } = await import('../src/mastra/mcpServers/apify.ts');
    
    console.log(`\n🔌 Apify MCP available: ${isApifyAvailable() ? '✅ Yes' : '❌ No'}`);
    
    if (isApifyAvailable()) {
      console.log('\n📡 Connecting to Apify MCP server...');
      const tools = await listApifyTools();
      
      if (tools) {
        const toolList = Object.keys(tools);
        console.log(`\n✅ Successfully connected! Found ${toolList.length} tools:`);
        
        // Show first 10 tools
        toolList.slice(0, 10).forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool}`);
        });
        
        if (toolList.length > 10) {
          console.log(`   ... and ${toolList.length - 10} more`);
        }
        
        // Check for expected automotive actors
        console.log('\n🚗 Checking for car dealership tools:');
        const expectedTools = [
          'call-actor',
          'get-actor-details',
          'search-actors',
          'add-actor',
          'remove-actor'
        ];
        
        expectedTools.forEach(tool => {
          const found = toolList.includes(tool);
          console.log(`   ${found ? '✅' : '❌'} ${tool}`);
        });
      }
    }
  } catch (error) {
    console.error('\n❌ Error testing connection:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run the test
testConnection().catch(console.error);