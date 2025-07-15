/**
 * @fileoverview Test semantic cache functionality
 * @module mastra/test/test-semantic-cache
 */

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { SemanticCacheService } from "../cache/semantic-cache";

async function testSemanticCache() {
  console.log("🧪 Testing Semantic Cache\n");
  
  const cache = new SemanticCacheService();
  
  try {
    // Test 1: Store some results
    console.log("1️⃣ Testing cache storage...");
    
    const testResults1 = {
      agencies: [
        { id: "1", name: "Test Agency 1", rating: 4.5 },
        { id: "2", name: "Test Agency 2", rating: 4.2 },
      ],
      timestamp: Date.now(),
    };
    
    await cache.set("car dealership", "Mexico City", testResults1);
    console.log("✅ Stored results for 'car dealership' in 'Mexico City'");
    
    // Test 2: Exact match retrieval
    console.log("\n2️⃣ Testing exact match retrieval...");
    const exactMatch = await cache.get("car dealership", "Mexico City");
    
    if (exactMatch) {
      console.log("✅ Retrieved exact match:", exactMatch);
    } else {
      console.log("❌ No exact match found");
    }
    
    // Test 3: Semantic match
    console.log("\n3️⃣ Testing semantic match...");
    
    // Store another result
    const testResults2 = {
      agencies: [
        { id: "3", name: "Auto Dealer Roma", rating: 4.8 },
      ],
      timestamp: Date.now(),
    };
    
    await cache.set("auto dealer", "Roma Norte CDMX", testResults2);
    console.log("✅ Stored results for 'auto dealer' in 'Roma Norte CDMX'");
    
    // Try semantic matches
    const semanticTests = [
      { query: "car dealer", location: "Mexico City" },
      { query: "auto dealership", location: "CDMX" },
      { query: "agencia de autos", location: "Ciudad de México" },
    ];
    
    for (const test of semanticTests) {
      const result = await cache.get(test.query, test.location);
      console.log(`\n   Query: "${test.query}" in "${test.location}"`);
      console.log(`   Result: ${result ? "✅ Found" : "❌ Not found"}`);
    }
    
    // Test 4: Cache statistics
    console.log("\n4️⃣ Testing cache statistics...");
    const stats = await cache.getStats();
    console.log("📊 Cache Stats:");
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Total hits: ${stats.totalHits}`);
    console.log(`   Avg hit rate: ${stats.avgHitRate.toFixed(2)}`);
    
    if (stats.oldestEntry > 0) {
      const age = Math.floor((Date.now() - stats.oldestEntry) / 1000);
      console.log(`   Oldest entry: ${age} seconds ago`);
    }
    
    console.log("\n✅ Semantic cache test completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\n💡 Make sure Upstash Redis is configured in .env.local");
  }
}

// Run test
testSemanticCache();