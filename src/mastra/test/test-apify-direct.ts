/**
 * Direct test of Apify integration
 */

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log("🔧 Environment check:");
console.log("APIFY_API_TOKEN:", process.env.APIFY_API_TOKEN ? `✅ ${process.env.APIFY_API_TOKEN.substring(0, 20)}...` : "❌ Not loaded");

// Test direct Apify API call
async function testApifyDirect() {
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
  
  if (!APIFY_TOKEN) {
    console.error("❌ No APIFY_API_TOKEN found");
    return;
  }

  console.log("\n🧪 Testing direct Apify API call...");
  
  try {
    // Test with a simple search
    const actorId = "compass/google-maps-extractor";
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs`;
    
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries: ["car dealers in Mexico City"],
        maxCrawledPlacesPerSearch: 5,
        language: "es",
        skipClosedPlaces: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ API Error:", response.status, error);
      return;
    }

    const run = await response.json();
    console.log("✅ Run started:", run.data.id);
    console.log("🔗 Monitor at:", `https://console.apify.com/actors/${actorId}/runs/${run.data.id}`);
    
    // Wait for completion
    console.log("⏳ Waiting for results...");
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
    
    // Get results
    const datasetUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${run.data.id}/dataset/items`;
    const dataResponse = await fetch(datasetUrl, {
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
    });
    
    if (dataResponse.ok) {
      const results = await dataResponse.json();
      console.log(`✅ Got ${results.length} results`);
      
      if (results.length > 0) {
        console.log("\n📍 Sample result:");
        const sample = results[0];
        console.log(`   Name: ${sample.title}`);
        console.log(`   Rating: ${sample.rating} ⭐`);
        console.log(`   Reviews: ${sample.reviewsCount}`);
        console.log(`   Address: ${sample.address}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testApifyDirect();