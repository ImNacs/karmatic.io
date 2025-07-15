/**
 * @fileoverview Test insights generator
 * @module mastra/test/test-insights-generator
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

import { generateInsights } from "../agents/insights-generator";
import { z } from "zod";
import { InsightsGeneratorInput as InsightsGeneratorInputSchema } from "../agents/insights-generator";

type InsightsGeneratorInput = z.infer<typeof InsightsGeneratorInputSchema>;

async function testInsightsGenerator() {
  console.log("🧪 Testing Insights Generator\n");
  
  // Test data combining all analyses
  const testInput: InsightsGeneratorInput = {
    agency: {
      name: "Premium Auto Gallery CDMX",
      type: "Multi-brand premium dealer",
      placeId: "ChIJ1234567890ABC",
    },
    rankingAnalysis: {
      overallScore: 75,
      marketPosition: "strong",
      metrics: {
        ratingPercentile: 80,
        reviewVelocity: 25,
        marketShare: 18,
      },
    },
    reputationAnalysis: {
      sentimentScore: 82,
      reputationLevel: "excellent",
      metrics: {
        averageRating: 4.6,
        responseRate: 45,
        socialPresence: "strong",
      },
    },
    inventoryAnalysis: {
      inventoryScore: 68,
      inventoryHealth: "good",
      metrics: {
        varietyScore: 75,
        priceCompetitiveness: "competitive",
        marketAlignment: 85,
      },
    },
  };
  
  try {
    console.log("1️⃣ Generating insights for:", testInput.agency.name);
    console.log(`   Type: ${testInput.agency.type}`);
    console.log(`   Ranking Score: ${testInput.rankingAnalysis.overallScore}/100`);
    console.log(`   Sentiment Score: ${testInput.reputationAnalysis.sentimentScore}%`);
    console.log(`   Inventory Score: ${testInput.inventoryAnalysis.inventoryScore}/100`);
    console.log("");
    
    const startTime = Date.now();
    const insights = await generateInsights(testInput);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log("✅ Insights generated in", duration.toFixed(2), "seconds\n");
    
    // Display results
    console.log("📊 COMPREHENSIVE AGENCY INSIGHTS");
    console.log("=" . repeat(60));
    
    console.log("\n🎯 Overall Assessment:");
    console.log(`   Score: ${insights.overallScore}/100`);
    console.log(`   Level: ${insights.overallAssessment.toUpperCase()}`);
    
    console.log("\n📝 Executive Summary:");
    console.log(`   ${insights.executiveSummary}`);
    
    console.log("\n💪 Key Strengths:");
    insights.keyStrengths.forEach((strength, i) => {
      console.log(`   ${i + 1}. [${strength.category.toUpperCase()}] ${strength.insight}`);
      console.log(`      Impact: ${strength.impact}`);
    });
    
    console.log("\n⚠️ Critical Issues:");
    if (insights.criticalIssues.length === 0) {
      console.log("   No critical issues identified");
    } else {
      insights.criticalIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.category.toUpperCase()}] ${issue.issue}`);
        console.log(`      Severity: ${issue.severity}`);
        console.log(`      Action: ${issue.recommendation}`);
      });
    }
    
    console.log("\n🎯 Strategic Recommendations:");
    insights.strategicRecommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
      console.log(`      Expected Impact: ${rec.expectedImpact}`);
      console.log(`      Resources: ${rec.resources}`);
    });
    
    console.log("\n🏆 Competitive Advantage:");
    console.log(`   ${insights.competitiveAdvantage}`);
    
    console.log("\n⚠️ Risk Assessment:");
    console.log(`   Level: ${insights.riskAssessment.level.toUpperCase()}`);
    console.log(`   Factors:`);
    insights.riskAssessment.factors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });
    
    console.log("\n" + "=" . repeat(60));
    
    // Test with poor performance
    console.log("\n2️⃣ Testing with poor performance agency...");
    const poorAnalysis = await generateInsights({
      agency: {
        name: "Struggling Auto Sales",
        type: "Used car dealer",
        placeId: "ChIJ9999888877XYZ",
      },
      rankingAnalysis: {
        overallScore: 35,
        marketPosition: "weak",
        metrics: {
          ratingPercentile: 25,
          reviewVelocity: 5,
          marketShare: 3,
        },
      },
      reputationAnalysis: {
        sentimentScore: 45,
        reputationLevel: "poor",
        metrics: {
          averageRating: 3.2,
          responseRate: 5,
          socialPresence: "none",
        },
      },
      inventoryAnalysis: {
        inventoryScore: 30,
        inventoryHealth: "poor",
        metrics: {
          varietyScore: 30,
          priceCompetitiveness: "expensive",
          marketAlignment: 40,
        },
      },
    });
    
    console.log("✅ Poor performance analysis completed");
    console.log(`   Overall: ${poorAnalysis.overallScore}/100 (${poorAnalysis.overallAssessment})`);
    console.log(`   Critical Issues: ${poorAnalysis.criticalIssues.length}`);
    console.log(`   Risk Level: ${poorAnalysis.riskAssessment.level}`);
    
    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testInsightsGenerator();