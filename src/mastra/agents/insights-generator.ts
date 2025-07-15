/**
 * @fileoverview Comprehensive insights generator for agency analysis
 * @module mastra/agents/insights-generator
 */

import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Get configured OpenRouter model for insights generation
 */
function getModel() {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
      'HTTP-Referer': 'https://karmatic.io',
      'X-Title': 'Karmatic Insights Generator',
    },
  });
  
  // Use Tier 3 model for comprehensive insights
  return openrouter(process.env.AI_MODEL_TIER3 || "google/gemini-2.0-flash-exp:free");
}

/**
 * Input schema for insights generation
 */
export const InsightsGeneratorInput = z.object({
  agency: z.object({
    name: z.string(),
    type: z.string(),
    placeId: z.string(),
  }),
  rankingAnalysis: z.object({
    overallScore: z.number(),
    marketPosition: z.string(),
    metrics: z.object({
      ratingPercentile: z.number(),
      reviewVelocity: z.number(),
      marketShare: z.number(),
    }),
  }),
  reputationAnalysis: z.object({
    sentimentScore: z.number(),
    reputationLevel: z.string(),
    metrics: z.object({
      averageRating: z.number(),
      responseRate: z.number(),
      socialPresence: z.string(),
    }),
  }),
  inventoryAnalysis: z.object({
    inventoryScore: z.number(),
    inventoryHealth: z.string(),
    metrics: z.object({
      varietyScore: z.number(),
      priceCompetitiveness: z.string(),
      marketAlignment: z.number(),
    }),
  }),
});

/**
 * Output schema for comprehensive insights
 */
export const InsightsGeneratorOutput = z.object({
  overallScore: z.number().min(0).max(100),
  overallAssessment: z.enum(["excellent", "good", "fair", "poor"]),
  executiveSummary: z.string(),
  keyStrengths: z.array(z.object({
    category: z.enum(["ranking", "reputation", "inventory"]),
    insight: z.string(),
    impact: z.enum(["high", "medium", "low"]),
  })),
  criticalIssues: z.array(z.object({
    category: z.enum(["ranking", "reputation", "inventory"]),
    issue: z.string(),
    severity: z.enum(["critical", "major", "minor"]),
    recommendation: z.string(),
  })),
  strategicRecommendations: z.array(z.object({
    priority: z.enum(["immediate", "short_term", "long_term"]),
    action: z.string(),
    expectedImpact: z.string(),
    resources: z.string(),
  })),
  competitiveAdvantage: z.string(),
  riskAssessment: z.object({
    level: z.enum(["low", "moderate", "high"]),
    factors: z.array(z.string()),
  }),
});

/**
 * System prompt for insights generation
 */
const INSIGHTS_GENERATOR_PROMPT = `You are a strategic business analyst specializing in automotive dealerships. 
Generate comprehensive insights by synthesizing multiple analysis dimensions.

Focus on:
1. Cross-dimensional patterns and correlations
2. Strategic opportunities and threats
3. Actionable recommendations with clear priorities
4. Competitive positioning and differentiation

Be strategic, insightful, and action-oriented.

Output your analysis as a valid JSON object with these exact fields:
- executiveSummary: 2-3 sentence strategic overview
- keyStrengths: array of strength objects with category, insight, and impact
- criticalIssues: array of issue objects with category, issue, severity, and recommendation
- strategicRecommendations: array of recommendation objects with priority, action, expectedImpact, and resources
- competitiveAdvantage: single sentence describing main differentiator
- riskAssessment: object with level and array of risk factors`;

/**
 * Generate comprehensive insights
 */
export async function generateInsights(
  input: z.infer<typeof InsightsGeneratorInput>
): Promise<z.infer<typeof InsightsGeneratorOutput>> {
  try {
    console.log("🔍 Generating comprehensive insights for:", input.agency.name);
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (input.rankingAnalysis.overallScore * 0.35) +
      (input.reputationAnalysis.sentimentScore * 0.35) +
      (input.inventoryAnalysis.inventoryScore * 0.30)
    );
    
    // Determine overall assessment
    const overallAssessment = 
      overallScore >= 80 ? "excellent" :
      overallScore >= 65 ? "good" :
      overallScore >= 50 ? "fair" : "poor";
    
    // Identify strengths across dimensions
    const strengths: any[] = [];
    if (input.rankingAnalysis.marketPosition === "leader" || input.rankingAnalysis.marketPosition === "strong") {
      strengths.push({
        category: "ranking",
        insight: `Market ${input.rankingAnalysis.marketPosition} with ${input.rankingAnalysis.metrics.marketShare}% share`,
        impact: "high",
      });
    }
    if (input.reputationAnalysis.sentimentScore >= 75) {
      strengths.push({
        category: "reputation",
        insight: `${input.reputationAnalysis.sentimentScore}% positive sentiment indicates strong customer satisfaction`,
        impact: "high",
      });
    }
    if (input.inventoryAnalysis.metrics.varietyScore >= 70) {
      strengths.push({
        category: "inventory",
        insight: `Diverse inventory with ${input.inventoryAnalysis.metrics.varietyScore}% variety score`,
        impact: "medium",
      });
    }
    
    // Identify critical issues
    const issues: any[] = [];
    if (input.rankingAnalysis.marketPosition === "weak") {
      issues.push({
        category: "ranking",
        issue: "Weak market position threatens customer acquisition",
        severity: "critical",
        recommendation: "Implement aggressive SEO and review generation campaign",
      });
    }
    if (input.reputationAnalysis.metrics.responseRate < 20) {
      issues.push({
        category: "reputation",
        issue: `Low review response rate (${input.reputationAnalysis.metrics.responseRate}%)`,
        severity: "major",
        recommendation: "Establish dedicated customer feedback management process",
      });
    }
    if (input.inventoryAnalysis.inventoryHealth === "poor") {
      issues.push({
        category: "inventory",
        issue: "Poor inventory health limits sales potential",
        severity: "major",
        recommendation: "Optimize inventory mix based on market demand",
      });
    }
    
    // Risk assessment
    const riskFactors = [];
    if (overallScore < 50) riskFactors.push("Overall performance below market average");
    if (input.reputationAnalysis.metrics.socialPresence === "none") riskFactors.push("No social media presence");
    if (input.inventoryAnalysis.metrics.marketAlignment < 60) riskFactors.push("Inventory misaligned with market demand");
    
    const riskLevel = 
      riskFactors.length >= 3 || overallScore < 40 ? "high" :
      riskFactors.length >= 1 || overallScore < 60 ? "moderate" : "low";
    
    // Generate prompt for AI analysis
    const prompt = `
Analyze this automotive dealership comprehensively:

Agency: ${input.agency.name} (${input.agency.type})

Ranking Performance:
- Overall Score: ${input.rankingAnalysis.overallScore}/100
- Market Position: ${input.rankingAnalysis.marketPosition}
- Rating Percentile: ${input.rankingAnalysis.metrics.ratingPercentile}%
- Review Velocity: ${input.rankingAnalysis.metrics.reviewVelocity} reviews/month
- Market Share: ${input.rankingAnalysis.metrics.marketShare}%

Reputation Status:
- Sentiment Score: ${input.reputationAnalysis.sentimentScore}%
- Reputation Level: ${input.reputationAnalysis.reputationLevel}
- Average Rating: ${input.reputationAnalysis.metrics.averageRating} stars
- Response Rate: ${input.reputationAnalysis.metrics.responseRate}%
- Social Presence: ${input.reputationAnalysis.metrics.socialPresence}

Inventory Analysis:
- Inventory Score: ${input.inventoryAnalysis.inventoryScore}/100
- Health Status: ${input.inventoryAnalysis.inventoryHealth}
- Variety Score: ${input.inventoryAnalysis.metrics.varietyScore}%
- Price Competitiveness: ${input.inventoryAnalysis.metrics.priceCompetitiveness}
- Market Alignment: ${input.inventoryAnalysis.metrics.marketAlignment}%

Overall Score: ${overallScore}/100
Assessment: ${overallAssessment}

Provide strategic insights and actionable recommendations.`;

    // Try AI analysis
    let aiAnalysis: any = {};
    try {
      const response = await generateText({
        model: getModel(),
        system: INSIGHTS_GENERATOR_PROMPT,
        prompt,
        temperature: 0.4,
        maxTokens: 800,
      });
      
      aiAnalysis = JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI analysis error:", error);
      // Continue with fallback
    }
    
    // Combine AI insights with calculated data
    return {
      overallScore,
      overallAssessment,
      executiveSummary: aiAnalysis.executiveSummary || 
        `${input.agency.name} achieves an overall score of ${overallScore}/100, placing it in the ${overallAssessment} category. ` +
        `The dealership shows ${strengths.length > issues.length ? 'strong fundamentals with' : 'challenges requiring'} ` +
        `${issues.length > 0 ? 'focused improvements in key areas.' : 'continued excellence.'}`,
      keyStrengths: aiAnalysis.keyStrengths || strengths.slice(0, 3),
      criticalIssues: aiAnalysis.criticalIssues || issues.slice(0, 3),
      strategicRecommendations: aiAnalysis.strategicRecommendations || [
        {
          priority: issues.length > 2 ? "immediate" : "short_term",
          action: issues[0]?.recommendation || "Maintain current performance standards",
          expectedImpact: "20-30% improvement in customer acquisition",
          resources: "Marketing team + $5,000/month budget",
        },
        {
          priority: "short_term",
          action: input.reputationAnalysis.metrics.socialPresence === "none" 
            ? "Launch social media presence across key platforms"
            : "Enhance social media engagement strategy",
          expectedImpact: "Increased brand awareness and customer engagement",
          resources: "Social media manager + content creation",
        },
        {
          priority: "long_term",
          action: "Implement data-driven inventory optimization system",
          expectedImpact: "15% increase in inventory turnover",
          resources: "Analytics platform + training",
        },
      ],
      competitiveAdvantage: aiAnalysis.competitiveAdvantage || 
        (overallScore >= 70 
          ? `Strong ${input.rankingAnalysis.marketPosition} position with ${input.reputationAnalysis.sentimentScore}% customer satisfaction`
          : `Established presence with opportunity for market share growth`),
      riskAssessment: {
        level: riskLevel,
        factors: aiAnalysis.riskAssessment?.factors || riskFactors,
      },
    };
  } catch (error) {
    console.error("Insights generation error:", error);
    
    // Return fallback insights
    return {
      overallScore: 50,
      overallAssessment: "fair",
      executiveSummary: "Analysis in progress. Initial assessment shows mixed performance across key metrics.",
      keyStrengths: [{
        category: "ranking",
        insight: "Established market presence",
        impact: "medium",
      }],
      criticalIssues: [{
        category: "reputation",
        issue: "Limited analysis available",
        severity: "minor",
        recommendation: "Complete full assessment",
      }],
      strategicRecommendations: [{
        priority: "immediate",
        action: "Conduct comprehensive performance audit",
        expectedImpact: "Baseline for improvement",
        resources: "Internal team",
      }],
      competitiveAdvantage: "Market presence with growth potential",
      riskAssessment: {
        level: "moderate",
        factors: ["Incomplete analysis"],
      },
    };
  }
}