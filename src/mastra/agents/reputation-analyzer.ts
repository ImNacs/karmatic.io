/**
 * @fileoverview Online reputation analysis agent
 * @module mastra/agents/reputation-analyzer
 */

import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Get configured OpenRouter model for reputation analysis
 */
function getModel() {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
      'HTTP-Referer': 'https://karmatic.io',
      'X-Title': 'Karmatic Reputation Analyzer',
    },
  });
  
  // Use Tier 2 model for more complex analysis
  return openrouter(process.env.AI_MODEL_TIER2 || "anthropic/claude-3-haiku-20240307");
}

/**
 * Input schema for reputation analysis
 */
export const ReputationAnalysisInput = z.object({
  agency: z.object({
    name: z.string(),
    rating: z.number(),
    reviewCount: z.number(),
    placeId: z.string(),
  }),
  reviews: z.array(z.object({
    rating: z.number(),
    text: z.string(),
    time: z.string(),
    authorName: z.string(),
  })).optional(),
  socialMedia: z.object({
    facebook: z.object({
      rating: z.number(),
      reviewCount: z.number(),
    }).optional(),
    instagram: z.object({
      followers: z.number(),
      posts: z.number(),
      engagement: z.number().describe("Average engagement rate"),
    }).optional(),
  }).optional(),
});

/**
 * Output schema for reputation insights
 */
export const ReputationAnalysisOutput = z.object({
  sentimentScore: z.number().min(0).max(100),
  reputationLevel: z.enum(["excellent", "good", "fair", "poor"]),
  insights: z.object({
    positiveThemes: z.array(z.string()),
    negativeThemes: z.array(z.string()),
    customerSatisfactionFactors: z.array(z.string()),
  }),
  metrics: z.object({
    averageRating: z.number(),
    responseRate: z.number().describe("Percentage of reviews with business response"),
    reviewGrowthTrend: z.enum(["increasing", "stable", "decreasing"]),
    socialPresence: z.enum(["strong", "moderate", "weak", "none"]),
  }),
  risks: z.array(z.object({
    type: z.string(),
    severity: z.enum(["high", "medium", "low"]),
    description: z.string(),
  })),
  recommendations: z.array(z.string()),
});

/**
 * System prompt for reputation analysis
 */
const REPUTATION_ANALYZER_PROMPT = `You are an online reputation expert. Analyze the agency's reputation across platforms.

Focus on:
1. Review sentiment and themes
2. Customer satisfaction patterns
3. Social media presence and engagement
4. Reputation risks and opportunities

Be objective and data-driven. Identify both strengths and weaknesses.

Output your analysis as a valid JSON object with these exact fields:
- positiveThemes: array of 3-5 positive recurring themes
- negativeThemes: array of 2-3 negative recurring themes
- customerSatisfactionFactors: array of 3-4 key satisfaction drivers
- risks: array of risk objects with type, severity, and description
- recommendations: array of 3-4 actionable recommendations`;

/**
 * Analyze agency reputation
 */
export async function analyzeReputation(
  input: z.infer<typeof ReputationAnalysisInput>
): Promise<z.infer<typeof ReputationAnalysisOutput>> {
  try {
    console.log("🔍 Starting reputation analysis for:", input.agency.name);
    
    // Calculate basic metrics
    const reviews = input.reviews || [];
    const recentReviews = reviews.slice(0, 10); // Last 10 reviews
    
    // Sentiment scoring based on ratings
    const ratingDistribution = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const positiveReviews = (ratingDistribution[4] || 0) + (ratingDistribution[5] || 0);
    const negativeReviews = (ratingDistribution[1] || 0) + (ratingDistribution[2] || 0);
    const sentimentScore = reviews.length > 0 
      ? Math.round((positiveReviews / reviews.length) * 100)
      : 75; // Default for no reviews
    
    // Determine reputation level
    const reputationLevel = 
      input.agency.rating >= 4.5 && sentimentScore >= 80 ? "excellent" :
      input.agency.rating >= 4.0 && sentimentScore >= 60 ? "good" :
      input.agency.rating >= 3.5 && sentimentScore >= 40 ? "fair" : "poor";
    
    // Check social presence
    const hasSocial = input.socialMedia?.facebook || input.socialMedia?.instagram;
    const socialPresence = !hasSocial ? "none" :
      (input.socialMedia?.instagram?.followers || 0) > 1000 ? "strong" :
      (input.socialMedia?.instagram?.followers || 0) > 500 ? "moderate" : "weak";
    
    // Generate prompt for AI analysis
    const prompt = `
Analyze this agency's online reputation:

Agency: ${input.agency.name}
Google Rating: ${input.agency.rating} stars (${input.agency.reviewCount} reviews)
Sentiment Score: ${sentimentScore}%

Recent Reviews Sample:
${recentReviews.map(r => `- ${r.rating}★: "${r.text.substring(0, 100)}..."`).join('\n')}

Social Media Presence:
- Facebook: ${input.socialMedia?.facebook ? `${input.socialMedia.facebook.rating}★ (${input.socialMedia.facebook.reviewCount} reviews)` : 'Not found'}
- Instagram: ${input.socialMedia?.instagram ? `${input.socialMedia.instagram.followers} followers, ${input.socialMedia.instagram.engagement}% engagement` : 'Not found'}

Provide comprehensive reputation analysis.`;

    // Try AI analysis
    let aiAnalysis: any = {};
    try {
      const response = await generateText({
        model: getModel(),
        system: REPUTATION_ANALYZER_PROMPT,
        prompt,
        temperature: 0.3,
        maxTokens: 600,
      });
      
      aiAnalysis = JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI analysis error:", error);
      // Continue with fallback
    }
    
    // Combine AI insights with calculated metrics
    return {
      sentimentScore,
      reputationLevel,
      insights: {
        positiveThemes: aiAnalysis.positiveThemes || [
          input.agency.rating >= 4.5 ? "Exceptional customer service" : "Good service quality",
          reviews.length > 100 ? "Well-established reputation" : "Growing customer base",
          "Professional staff",
        ],
        negativeThemes: aiAnalysis.negativeThemes || [
          input.agency.rating < 4.0 ? "Service consistency issues" : "Minor service delays",
          "Price concerns occasionally mentioned",
        ],
        customerSatisfactionFactors: aiAnalysis.customerSatisfactionFactors || [
          "Knowledgeable sales team",
          "Fair pricing",
          "Good vehicle selection",
          "After-sales support",
        ],
      },
      metrics: {
        averageRating: input.agency.rating,
        responseRate: 15, // Mock - would calculate from actual review responses
        reviewGrowthTrend: 
          reviews.length > 50 && sentimentScore > 70 ? "increasing" :
          reviews.length > 20 ? "stable" : "decreasing",
        socialPresence,
      },
      risks: aiAnalysis.risks || [
        {
          type: "Online Reputation",
          severity: reputationLevel === "poor" ? "high" : reputationLevel === "fair" ? "medium" : "low",
          description: reputationLevel === "poor" ? 
            "Low ratings may deter potential customers" :
            "Reputation is stable but has room for improvement",
        },
        ...(socialPresence === "none" ? [{
          type: "Social Media Presence",
          severity: "medium" as const,
          description: "No social media presence limits customer engagement",
        }] : []),
      ],
      recommendations: aiAnalysis.recommendations || [
        sentimentScore < 70 ? "Implement customer feedback program to address concerns" : "Maintain current service excellence",
        socialPresence === "none" ? "Establish social media presence for better engagement" : "Increase social media activity",
        "Respond to all reviews to show customer care",
        "Monitor and address negative feedback promptly",
      ],
    };
  } catch (error) {
    console.error("Reputation analysis error:", error);
    
    // Return fallback analysis
    return {
      sentimentScore: 70,
      reputationLevel: "good",
      insights: {
        positiveThemes: ["Established business"],
        negativeThemes: ["Analysis temporarily unavailable"],
        customerSatisfactionFactors: ["Service quality"],
      },
      metrics: {
        averageRating: input.agency.rating,
        responseRate: 0,
        reviewGrowthTrend: "stable",
        socialPresence: "none",
      },
      risks: [{
        type: "Analysis Error",
        severity: "low",
        description: "Unable to perform detailed analysis",
      }],
      recommendations: [
        "Continue monitoring online reputation",
        "Engage with customer feedback",
      ],
    };
  }
}