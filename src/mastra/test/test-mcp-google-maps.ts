/**
 * @fileoverview Test Google Maps scraper via MCP
 * @module mastra/test/test-mcp-google-maps
 */

import { AgencyFilterService, type AgencyData } from "../services/agency-filter";

// Mock the MCP call for testing
async function testGoogleMapsMCP() {
  console.log("🧪 Testing Google Maps via MCP\n");
  
  try {
    console.log("1️⃣ Would call compass-slash-google-maps-extractor with:");
    console.log({
      searchStringsArray: ["agencia de autos", "car dealer"],
      locationQuery: "Roma Norte, Ciudad de México",
      maxCrawledPlacesPerSearch: 20,
      language: "es",
      skipClosedPlaces: true,
      placeMinimumStars: "four",
    });
    
    // Mock response for testing filter
    const mockResults = [
      {
        placeId: "ChIJ1234567890",
        title: "Agencia Ford Roma",
        address: "Av. Álvaro Obregón 123, Roma Norte, CDMX",
        totalScore: 4.5,
        reviewsCount: 234,
        categoryName: "Car dealer",
        location: { lat: 19.4198, lng: -99.1617 },
      },
      {
        placeId: "ChIJ0987654321",
        title: "Autos Usados México",
        address: "Calle Orizaba 45, Roma Norte, CDMX",
        totalScore: 3.8,
        reviewsCount: 89,
        categoryName: "Used car dealer",
        location: { lat: 19.4185, lng: -99.1598 },
      },
      {
        placeId: "ChIJ5678901234",
        title: "Nissan Roma",
        address: "Insurgentes Sur 234, Roma Norte, CDMX",
        totalScore: 4.2,
        reviewsCount: 156,
        categoryName: "Nissan dealer",
        location: { lat: 19.4175, lng: -99.1625 },
      },
      {
        placeId: "ChIJ9012345678",
        title: "Motos y Refacciones",
        address: "Calle Puebla 78, Roma Norte, CDMX",
        totalScore: 4.7,
        reviewsCount: 45,
        categoryName: "Motorcycle dealer",
        location: { lat: 19.4165, lng: -99.1585 },
      },
    ];
    
    console.log(`\n✅ Mock scraped ${mockResults.length} businesses\n`);
    
    // Test filter
    console.log("2️⃣ Testing agency filter...");
    
    const filterService = new AgencyFilterService({
      minRating: 4.0,
      minReviewsPerMonth: 10,
      monthsToAnalyze: 6,
      businessTypes: ["car", "auto", "agencia", "dealer", "nissan", "ford"],
    });
    
    const agenciesToFilter: AgencyData[] = mockResults.map(place => ({
      placeId: place.placeId,
      name: place.title,
      rating: place.totalScore,
      reviewCount: place.reviewsCount,
      businessType: place.categoryName,
      location: place.location,
    }));
    
    const filterResults = filterService.filterAgencies(agenciesToFilter);
    
    console.log(`\n📊 Filter Results:`);
    console.log(`   Total: ${filterResults.stats.totalProcessed}`);
    console.log(`   Accepted: ${filterResults.stats.acceptedCount}`);
    console.log(`   Rejected: ${filterResults.stats.rejectedCount}`);
    console.log(`   Average Score: ${filterResults.stats.averageScore}/100`);
    console.log(`   Rejection Reasons:`, filterResults.stats.rejectionReasons);
    
    // Show accepted agencies
    if (filterResults.accepted.length > 0) {
      console.log("\n3️⃣ Accepted agencies:\n");
      
      filterResults.accepted.forEach((result, i) => {
        const agency = result.agency;
        console.log(`${i + 1}. ${agency.name}`);
        console.log(`   ⭐ ${agency.rating} (${agency.reviewCount} reviews)`);
        console.log(`   📊 Score: ${result.score}/100`);
        console.log(`   ✅ ${result.reasons.join(", ")}`);
        console.log("");
      });
    }
    
    console.log("✅ Filter test completed successfully!");
    console.log("\n💡 In production, we would use the actual MCP tool:");
    console.log("   mcp__apify-actors__compass-slash-google-maps-extractor");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testGoogleMapsMCP();