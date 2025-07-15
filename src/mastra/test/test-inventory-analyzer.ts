/**
 * @fileoverview Test inventory analysis agent
 * @module mastra/test/test-inventory-analyzer
 */

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify env is loaded
if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found in environment");
  process.exit(1);
}

import { analyzeInventory } from "../agents/inventory-analyzer";
import { z } from "zod";
import { InventoryAnalysisInput as InventoryAnalysisInputSchema } from "../agents/inventory-analyzer";

type InventoryAnalysisInput = z.infer<typeof InventoryAnalysisInputSchema>;

async function testInventoryAnalyzer() {
  console.log("🧪 Testing Inventory Analysis Agent\n");
  
  // Test data with full inventory info
  const testInput: InventoryAnalysisInput = {
    agency: {
      name: "Nissan Insurgentes Sur",
      type: "Nissan dealer",
      placeId: "ChIJ5432167890DEF",
    },
    inventory: {
      totalVehicles: 87,
      categories: [
        {
          type: "SUV",
          count: 35,
          percentage: 40,
        },
        {
          type: "Sedan",
          count: 25,
          percentage: 29,
        },
        {
          type: "Pickup",
          count: 18,
          percentage: 21,
        },
        {
          type: "Hatchback",
          count: 9,
          percentage: 10,
        },
      ],
      priceRange: {
        min: 250000,
        max: 850000,
        average: 425000,
      },
      brands: ["Nissan"],
    },
    marketData: {
      averageInventorySize: 65,
      topSellingCategories: ["SUV", "Pickup", "Sedan"],
      priceComparison: "at_market",
    },
  };
  
  try {
    console.log("1️⃣ Analyzing inventory for:", testInput.agency.name);
    console.log(`   Type: ${testInput.agency.type}`);
    console.log(`   Vehicles: ${testInput.inventory?.totalVehicles || "Unknown"}`);
    console.log(`   Categories: ${testInput.inventory?.categories?.length || 0}`);
    console.log("");
    
    const startTime = Date.now();
    const analysis = await analyzeInventory(testInput);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log("✅ Analysis completed in", duration.toFixed(2), "seconds\n");
    
    // Display results
    console.log("📊 INVENTORY ANALYSIS RESULTS");
    console.log("=" . repeat(50));
    
    console.log("\n🎯 Overall Assessment:");
    console.log(`   Inventory Score: ${analysis.inventoryScore}/100`);
    console.log(`   Health Status: ${analysis.inventoryHealth.toUpperCase()}`);
    
    console.log("\n📈 Key Metrics:");
    console.log(`   Variety Score: ${analysis.metrics.varietyScore}/100`);
    console.log(`   Price Competitiveness: ${analysis.metrics.priceCompetitiveness}`);
    console.log(`   Inventory Turnover: ${analysis.metrics.inventoryTurnover}`);
    console.log(`   Market Alignment: ${analysis.metrics.marketAlignment}%`);
    
    console.log("\n💪 Inventory Strengths:");
    analysis.insights.strengths.forEach((strength, i) => {
      console.log(`   ${i + 1}. ${strength}`);
    });
    
    console.log("\n⚠️ Inventory Weaknesses:");
    analysis.insights.weaknesses.forEach((weakness, i) => {
      console.log(`   ${i + 1}. ${weakness}`);
    });
    
    console.log("\n🎯 Market Opportunities:");
    analysis.insights.opportunities.forEach((opp, i) => {
      console.log(`   ${i + 1}. ${opp}`);
    });
    
    console.log("\n💡 Recommendations:");
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    console.log("\n" + "=" . repeat(50));
    
    // Test with minimal data
    console.log("\n2️⃣ Testing with minimal inventory data...");
    const minimalAnalysis = await analyzeInventory({
      agency: {
        name: "Autos Seminuevos El Centro",
        type: "Multi-brand used cars",
        placeId: "ChIJ9999888877XYZ",
      },
      inventory: {
        totalVehicles: 15,
      },
    });
    
    console.log("✅ Minimal analysis completed");
    console.log(`   Score: ${minimalAnalysis.inventoryScore}/100`);
    console.log(`   Health: ${minimalAnalysis.inventoryHealth}`);
    console.log(`   Variety: ${minimalAnalysis.metrics.varietyScore}/100`);
    
    // Test with no inventory data
    console.log("\n3️⃣ Testing with no inventory data...");
    const noDataAnalysis = await analyzeInventory({
      agency: {
        name: "AutoNuevo Express",
        type: "New car dealer",
        placeId: "ChIJ1111222233ABC",
      },
    });
    
    console.log("✅ No-data analysis completed");
    console.log(`   Score: ${noDataAnalysis.inventoryScore}/100`);
    console.log(`   Health: ${noDataAnalysis.inventoryHealth}`);
    
    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testInventoryAnalyzer();