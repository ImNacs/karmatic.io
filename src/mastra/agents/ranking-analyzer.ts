/**
 * @fileoverview Google Maps ranking analysis agent
 * @module mastra/agents/ranking-analyzer
 */

import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Get configured OpenRouter model
 */
function getModel() {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
      'HTTP-Referer': 'https://karmatic.io',
      'X-Title': 'Karmatic Ranking Analyzer',
    },
  });
  
  return openrouter(process.env.AI_MODEL_TIER1 || "google/gemini-2.0-flash-exp:free");
}

/**
 * Input schema for ranking analysis
 */
export const RankingAnalysisInput = z.object({
  agency: z.object({
    name: z.string(),
    rating: z.number(),
    reviewCount: z.number(),
    address: z.string(),
    businessType: z.string(),
    placeId: z.string(),
  }),
  competitors: z.array(z.object({
    name: z.string(),
    rating: z.number(),
    reviewCount: z.number(),
    distance: z.number().describe("Distance in km from search center"),
  })).optional(),
  searchContext: z.object({
    query: z.string(),
    location: z.string(),
    totalResults: z.number(),
  }),
});

/**
 * Output schema for ranking insights
 */
export const RankingAnalysisOutput = z.object({
  overallScore: z.number().min(0).max(100),
  marketPosition: z.enum(["leader", "strong", "average", "weak"]),
  insights: z.object({
    strengthFactors: z.array(z.string()),
    weaknessFactors: z.array(z.string()),
    competitiveAdvantages: z.array(z.string()),
  }),
  metrics: z.object({
    ratingPercentile: z.number().describe("Percentile compared to competitors"),
    reviewVelocity: z.number().describe("Reviews per month estimate"),
    marketShare: z.number().describe("Estimated market share percentage"),
  }),
  recommendations: z.array(z.string()),
});

/**
 * System prompt for ranking analysis
 */
const RANKING_ANALYZER_PROMPT = `You are a Google Maps ranking expert. Analyze the agency's position and provide insights.

Focus on:
1. Rating comparison with competitors
2. Review count and velocity analysis
3. Market positioning assessment
4. Competitive advantages identification

Be concise and data-driven. Provide actionable recommendations.

Output your analysis as a valid JSON object with these exact fields:
- strengthFactors: array of 3-5 string insights
- weaknessFactors: array of 2-3 string insights  
- competitiveAdvantages: array of 2-3 string insights
- recommendations: array of 3-4 actionable string recommendations`;

/**
 * Analyze agency ranking
 */
export async function analyzeRanking(
  input: z.infer<typeof RankingAnalysisInput>
): Promise<z.infer<typeof RankingAnalysisOutput>> {
  try {
    console.log("🔍 Starting ranking analysis for:", input.agency.name);
    // Calculate basic metrics
    const competitors = input.competitors || [];
    const allRatings = [input.agency.rating, ...competitors.map(c => c.rating)];
    const allReviewCounts = [input.agency.reviewCount, ...competitors.map(c => c.reviewCount)];
    
    // Calculate percentiles
    const ratingPercentile = calculatePercentile(allRatings, input.agency.rating);
    const reviewPercentile = calculatePercentile(allReviewCounts, input.agency.reviewCount);
    
    // Estimate review velocity (simplified)
    const reviewVelocity = Math.round(input.agency.reviewCount / 24); // Assume 2 years average
    
    // Market share estimate
    const totalReviews = allReviewCounts.reduce((sum, count) => sum + count, 0);
    const marketShare = Math.round((input.agency.reviewCount / totalReviews) * 100);
    
    // Generate prompt for AI analysis
    const prompt = `
Analyze this agency's Google Maps ranking:

Agency: ${input.agency.name}
Rating: ${input.agency.rating} stars (${input.agency.reviewCount} reviews)
Type: ${input.agency.businessType}
Location: ${input.agency.address}

Competitors in area: ${competitors.length}
Average competitor rating: ${(competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length).toFixed(2)}
Average competitor reviews: ${Math.round(competitors.reduce((sum, c) => sum + c.reviewCount, 0) / competitors.length)}

Search context: "${input.searchContext.query}" in ${input.searchContext.location}
Total results found: ${input.searchContext.totalResults}

Provide analysis in JSON format with:
- Market position assessment
- Strength factors (3-5 points)
- Weakness factors (2-3 points)
- Competitive advantages (2-3 points)
- Actionable recommendations (3-4 points)
`;

    const response = await generateText({
      model: getModel(),
      system: RANKING_ANALYZER_PROMPT,
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    });

    // Parse AI response and combine with metrics
    const aiAnalysis = JSON.parse(response.text || "{}");
    
    // Determine market position
    const marketPosition = 
      ratingPercentile >= 75 && reviewPercentile >= 75 ? "leader" :
      ratingPercentile >= 50 || reviewPercentile >= 50 ? "strong" :
      ratingPercentile >= 25 || reviewPercentile >= 25 ? "average" : "weak";
    
    // Calculate overall score
    const overallScore = Math.round(
      (ratingPercentile * 0.4) + 
      (reviewPercentile * 0.3) + 
      (marketShare * 0.3)
    );
    
    return {
      overallScore,
      marketPosition,
      insights: {
        strengthFactors: aiAnalysis.strengthFactors || [
          `Rating above ${Math.round(ratingPercentile)}% of competitors`,
          `${input.agency.reviewCount} verified customer reviews`,
          reviewVelocity > 10 ? "High review velocity indicates active customer base" : "Steady review accumulation",
        ],
        weaknessFactors: aiAnalysis.weaknessFactors || [
          ratingPercentile < 50 ? "Rating below market average" : "Room for rating improvement",
          reviewPercentile < 50 ? "Lower review count than competitors" : "Review count could be higher",
        ],
        competitiveAdvantages: aiAnalysis.competitiveAdvantages || [
          input.agency.rating >= 4.5 ? "Premium rating attracts quality-conscious customers" : "Solid reputation in market",
          marketShare > 20 ? "Significant market presence" : "Growing market presence",
        ],
      },
      metrics: {
        ratingPercentile,
        reviewVelocity,
        marketShare,
      },
      recommendations: aiAnalysis.recommendations || [
        reviewVelocity < 15 ? "Implement review request campaign to boost velocity" : "Maintain current review acquisition strategy",
        ratingPercentile < 70 ? "Focus on service quality to improve ratings" : "Continue excellence in customer service",
        "Monitor competitor activities and adjust strategies accordingly",
        "Optimize Google My Business profile for better visibility",
      ],
    };
  } catch (error) {
    console.error("Ranking analysis error:", error);
    
    // Return fallback analysis
    return {
      overallScore: 50,
      marketPosition: "average",
      insights: {
        strengthFactors: ["Established presence on Google Maps"],
        weaknessFactors: ["Analysis temporarily unavailable"],
        competitiveAdvantages: ["Local market knowledge"],
      },
      metrics: {
        ratingPercentile: 50,
        reviewVelocity: 10,
        marketShare: 10,
      },
      recommendations: [
        "Continue monitoring performance metrics",
        "Focus on customer satisfaction",
      ],
    };
  }
}

/**
 * Calculate percentile rank
 */
function calculatePercentile(values: number[], target: number): number {
  const sorted = values.sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= target);
  return Math.round((index / values.length) * 100);
}