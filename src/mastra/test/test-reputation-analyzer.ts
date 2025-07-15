/**
 * @fileoverview Test reputation analysis agent
 * @module mastra/test/test-reputation-analyzer
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

import { analyzeReputation } from "../agents/reputation-analyzer";
import { z } from "zod";
import { ReputationAnalysisInput as ReputationAnalysisInputSchema } from "../agents/reputation-analyzer";

type ReputationAnalysisInput = z.infer<typeof ReputationAnalysisInputSchema>;

async function testReputationAnalyzer() {
  console.log("🧪 Testing Reputation Analysis Agent\n");
  
  // Test data with reviews
  const testInput: ReputationAnalysisInput = {
    agency: {
      name: "AutoMax Premium CDMX",
      rating: 4.3,
      reviewCount: 287,
      placeId: "ChIJ9876543210XYZ",
    },
    reviews: [
      {
        rating: 5,
        text: "Excelente servicio, muy profesionales y atentos. Los precios son justos y el proceso fue rápido.",
        time: "2024-01-15",
        authorName: "María García",
      },
      {
        rating: 4,
        text: "Buena atención, aunque el tiempo de espera fue un poco largo. El vendedor conocía bien los autos.",
        time: "2024-01-10",
        authorName: "Juan Pérez",
      },
      {
        rating: 2,
        text: "Mal servicio post-venta. No responden llamadas y tuve problemas con la garantía.",
        time: "2024-01-05",
        authorName: "Carlos López",
      },
      {
        rating: 5,
        text: "La mejor agencia de la zona. Personal muy capacitado y honestos en todo momento.",
        time: "2023-12-28",
        authorName: "Ana Martínez",
      },
      {
        rating: 3,
        text: "Regular. Los precios son altos comparados con otras agencias. La atención fue correcta.",
        time: "2023-12-20",
        authorName: "Roberto Sánchez",
      },
    ],
    socialMedia: {
      facebook: {
        rating: 4.1,
        reviewCount: 156,
      },
      instagram: {
        followers: 3420,
        posts: 245,
        engagement: 3.5,
      },
    },
  };
  
  try {
    console.log("1️⃣ Analyzing reputation for:", testInput.agency.name);
    console.log(`   Google: ${testInput.agency.rating} ⭐ (${testInput.agency.reviewCount} reviews)`);
    console.log(`   Facebook: ${testInput.socialMedia?.facebook?.rating} ⭐`);
    console.log(`   Instagram: ${testInput.socialMedia?.instagram?.followers} followers`);
    console.log("");
    
    const startTime = Date.now();
    const analysis = await analyzeReputation(testInput);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log("✅ Analysis completed in", duration.toFixed(2), "seconds\n");
    
    // Display results
    console.log("📊 REPUTATION ANALYSIS RESULTS");
    console.log("=" . repeat(50));
    
    console.log("\n🎯 Overall Assessment:");
    console.log(`   Sentiment Score: ${analysis.sentimentScore}%`);
    console.log(`   Reputation Level: ${analysis.reputationLevel.toUpperCase()}`);
    
    console.log("\n📈 Key Metrics:");
    console.log(`   Average Rating: ${analysis.metrics.averageRating} ⭐`);
    console.log(`   Response Rate: ${analysis.metrics.responseRate}%`);
    console.log(`   Review Growth: ${analysis.metrics.reviewGrowthTrend}`);
    console.log(`   Social Presence: ${analysis.metrics.socialPresence}`);
    
    console.log("\n✅ Positive Themes:");
    analysis.insights.positiveThemes.forEach((theme, i) => {
      console.log(`   ${i + 1}. ${theme}`);
    });
    
    console.log("\n❌ Negative Themes:");
    analysis.insights.negativeThemes.forEach((theme, i) => {
      console.log(`   ${i + 1}. ${theme}`);
    });
    
    console.log("\n😊 Customer Satisfaction Factors:");
    analysis.insights.customerSatisfactionFactors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });
    
    console.log("\n⚠️ Reputation Risks:");
    analysis.risks.forEach((risk, i) => {
      console.log(`   ${i + 1}. [${risk.severity.toUpperCase()}] ${risk.type}: ${risk.description}`);
    });
    
    console.log("\n💡 Recommendations:");
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    console.log("\n" + "=" . repeat(50));
    
    // Test with no social media
    console.log("\n2️⃣ Testing without social media presence...");
    const minimalAnalysis = await analyzeReputation({
      ...testInput,
      socialMedia: undefined,
      reviews: [],
    });
    
    console.log("✅ Minimal analysis completed");
    console.log(`   Sentiment: ${minimalAnalysis.sentimentScore}%`);
    console.log(`   Level: ${minimalAnalysis.reputationLevel}`);
    console.log(`   Social: ${minimalAnalysis.metrics.socialPresence}`);
    console.log(`   Risks: ${minimalAnalysis.risks.length}`);
    
    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testReputationAnalyzer();