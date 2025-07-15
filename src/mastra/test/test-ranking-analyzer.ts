/**
 * @fileoverview Test ranking analysis agent
 * @module mastra/test/test-ranking-analyzer
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

import { analyzeRanking } from "../agents/ranking-analyzer";
import { z } from "zod";
import { RankingAnalysisInput as RankingAnalysisInputSchema } from "../agents/ranking-analyzer";

type RankingAnalysisInput = z.infer<typeof RankingAnalysisInputSchema>;

async function testRankingAnalyzer() {
  console.log("🧪 Testing Ranking Analysis Agent\n");
  
  // Test data
  const testInput: RankingAnalysisInput = {
    agency: {
      name: "Ford Roma Norte",
      rating: 4.6,
      reviewCount: 342,
      address: "Av. Álvaro Obregón 234, Roma Norte, CDMX",
      businessType: "Ford dealer",
      placeId: "ChIJ1234567890ABC",
    },
    competitors: [
      {
        name: "Nissan Insurgentes",
        rating: 4.3,
        reviewCount: 489,
        distance: 0.5,
      },
      {
        name: "AutoMax CDMX",
        rating: 4.1,
        reviewCount: 234,
        distance: 0.8,
      },
      {
        name: "Autos Seminuevos Premium",
        rating: 3.9,
        reviewCount: 156,
        distance: 0.3,
      },
      {
        name: "Chevrolet Condesa",
        rating: 4.4,
        reviewCount: 567,
        distance: 1.2,
      },
    ],
    searchContext: {
      query: "agencia de autos",
      location: "Roma Norte, CDMX",
      totalResults: 45,
    },
  };
  
  try {
    console.log("1️⃣ Analyzing ranking for:", testInput.agency.name);
    console.log(`   Rating: ${testInput.agency.rating} ⭐ (${testInput.agency.reviewCount} reviews)`);
    console.log(`   Competitors: ${testInput.competitors.length}`);
    console.log("");
    
    const startTime = Date.now();
    const analysis = await analyzeRanking(testInput);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log("✅ Analysis completed in", duration.toFixed(2), "seconds\n");
    
    // Display results
    console.log("📊 RANKING ANALYSIS RESULTS");
    console.log("=" . repeat(50));
    
    console.log("\n🎯 Overall Performance:");
    console.log(`   Score: ${analysis.overallScore}/100`);
    console.log(`   Market Position: ${analysis.marketPosition.toUpperCase()}`);
    
    console.log("\n📈 Key Metrics:");
    console.log(`   Rating Percentile: ${analysis.metrics.ratingPercentile}%`);
    console.log(`   Review Velocity: ${analysis.metrics.reviewVelocity} reviews/month`);
    console.log(`   Market Share: ${analysis.metrics.marketShare}%`);
    
    console.log("\n💪 Strength Factors:");
    analysis.insights.strengthFactors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });
    
    console.log("\n⚠️ Weakness Factors:");
    analysis.insights.weaknessFactors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });
    
    console.log("\n🏆 Competitive Advantages:");
    analysis.insights.competitiveAdvantages.forEach((advantage, i) => {
      console.log(`   ${i + 1}. ${advantage}`);
    });
    
    console.log("\n💡 Recommendations:");
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    console.log("\n" + "=" . repeat(50));
    
    // Test with no competitors
    console.log("\n2️⃣ Testing with no competitors...");
    const soloAnalysis = await analyzeRanking({
      ...testInput,
      competitors: [],
    });
    
    console.log("✅ Solo analysis completed");
    console.log(`   Score: ${soloAnalysis.overallScore}/100`);
    console.log(`   Position: ${soloAnalysis.marketPosition}`);
    
    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testRankingAnalyzer();