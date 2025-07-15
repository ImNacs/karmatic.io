/**
 * @fileoverview Test Apify Google Maps scraper with agency filter
 * @module mastra/test/test-apify-scraper
 */

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { scrapeGoogleMaps } from "../tools/apify-google-maps";
import { AgencyFilterService, type AgencyData } from "../services/agency-filter";

async function testApifyScraper() {
  console.log("🧪 Testing Apify Google Maps Scraper\n");
  
  try {
    // Test 1: Scrape agencies
    console.log("1️⃣ Scraping car dealerships in Roma Norte, CDMX...");
    
    const result = await scrapeGoogleMaps({
      query: "agencia de autos",
      location: "Roma Norte, Ciudad de México",
      maxResults: 20,
      minRating: 3.0, // Lower for testing
      language: "es",
    });
    
    console.log(`✅ Scraped ${result.totalFound} agencies`);
    console.log(`💰 Cost: $${result.cost.toFixed(4)}`);
    console.log(`🔗 Run ID: ${result.runId}\n`);
    
    // Test 2: Apply filters
    console.log("2️⃣ Applying agency filters...");
    
    const filterService = new AgencyFilterService({
      minRating: 4.0,
      minReviewsPerMonth: 5, // Lower for testing
      monthsToAnalyze: 6,
      businessTypes: ["car", "auto", "agencia", "dealer"],
    });
    
    // Transform to filter format
    const agenciesToFilter: AgencyData[] = result.agencies.map(agency => ({
      placeId: agency.placeId,
      name: agency.title,
      rating: agency.totalScore,
      reviewCount: agency.reviewsCount,
      businessType: agency.categoryName,
      location: agency.location,
      // Since we don't have recent reviews from this scraper, we'll estimate
      recentReviews: undefined,
    }));
    
    const filterResults = filterService.filterAgencies(agenciesToFilter);
    
    console.log(`📊 Filter Results:`);
    console.log(`   Total: ${filterResults.stats.totalProcessed}`);
    console.log(`   Accepted: ${filterResults.stats.acceptedCount}`);
    console.log(`   Rejected: ${filterResults.stats.rejectedCount}`);
    console.log(`   Average Score: ${filterResults.stats.averageScore}/100`);
    console.log(`   Rejection Reasons:`, filterResults.stats.rejectionReasons);
    console.log("");
    
    // Test 3: Display accepted agencies
    if (filterResults.accepted.length > 0) {
      console.log("3️⃣ Top accepted agencies:\n");
      
      filterResults.accepted
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .forEach((filterResult, i) => {
          const agency = filterResult.agency;
          const original = result.agencies.find(a => a.placeId === agency.placeId);
          
          console.log(`${i + 1}. ${agency.name}`);
          console.log(`   📍 ${original?.address || 'N/A'}`);
          console.log(`   ⭐ ${agency.rating} (${agency.reviewCount} reviews)`);
          console.log(`   📊 Score: ${filterResult.score}/100`);
          console.log(`   🏷️ Type: ${agency.businessType}`);
          
          if (original?.phone) {
            console.log(`   📞 ${original.phone}`);
          }
          if (original?.website) {
            console.log(`   🌐 ${original.website}`);
          }
          console.log("");
        });
    }
    
    console.log("✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testApifyScraper();