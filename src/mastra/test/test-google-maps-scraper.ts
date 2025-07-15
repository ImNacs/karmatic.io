/**
 * @fileoverview Test script for Google Maps scraper
 * @module mastra/test/test-google-maps-scraper
 */

// Load environment variables for testing
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { googleMapsScraperTool } from "../tools/google-maps-scraper";
import { AgencyFilterService } from "../services/agency-filter";
import { listApifyToolsTest } from "../mcpServers/apify-test";

async function testGoogleMapsScraper() {
  console.log("🧪 Testing Google Maps Scraper Integration\n");

  // Test 1: Check Apify connection
  console.log("1️⃣ Testing Apify MCP connection...");
  const tools = await listApifyToolsTest();
  if (!tools) {
    console.error("❌ Failed to connect to Apify MCP. Check APIFY_API_TOKEN");
    return;
  }
  console.log("✅ Apify MCP connected successfully\n");

  // Test 2: Test Google Maps scraper with a small query
  console.log("2️⃣ Testing Google Maps scraper...");
  const scraperResult = await googleMapsScraperTool.execute({
    input: {
      query: "agencias de autos en Roma Norte CDMX",
      maxResults: 10,
      minRating: 3.5, // Lower for testing
      includeReviews: true,
      businessTypes: ["car dealer", "auto", "agencia"],
    },
  });

  if (!scraperResult.success) {
    console.error("❌ Scraper failed to execute");
    return;
  }

  console.log(`✅ Scraped ${scraperResult.totalFound} businesses`);
  console.log(`⏱️ Execution time: ${scraperResult.executionTime}s`);
  console.log(`💰 Estimated cost: $${scraperResult.cost.toFixed(4)}\n`);

  // Test 3: Test agency filter
  console.log("3️⃣ Testing agency filter...");
  const filterService = new AgencyFilterService({
    minRating: 4.0,
    minReviewsPerMonth: 5, // Lower for testing
    monthsToAnalyze: 6,
  });

  const filterResults = filterService.filterAgencies(scraperResult.businesses);
  
  console.log(`📊 Filter Results:`);
  console.log(`   - Total processed: ${filterResults.stats.totalProcessed}`);
  console.log(`   - Accepted: ${filterResults.stats.acceptedCount}`);
  console.log(`   - Rejected: ${filterResults.stats.rejectedCount}`);
  console.log(`   - Average score: ${filterResults.stats.averageScore}/100`);
  console.log(`   - Rejection reasons:`, filterResults.stats.rejectionReasons);
  console.log("");

  // Test 4: Display sample results
  if (filterResults.accepted.length > 0) {
    console.log("4️⃣ Sample accepted agencies:");
    filterResults.accepted.slice(0, 3).forEach((result, i) => {
      const agency = result.agency;
      console.log(`\n${i + 1}. ${agency.name}`);
      console.log(`   Rating: ${agency.rating} ⭐ (${agency.reviewCount} reviews)`);
      console.log(`   Type: ${agency.businessType}`);
      console.log(`   Score: ${result.score}/100`);
      console.log(`   Metrics:`, result.metrics);
    });
  }

  console.log("\n✅ All tests completed successfully!");
}

// Run tests
testGoogleMapsScraper().catch(console.error);