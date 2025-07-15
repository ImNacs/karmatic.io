/**
 * @fileoverview Inventory analysis agent for automotive agencies
 * @module mastra/agents/inventory-analyzer
 */

import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Get configured OpenRouter model for inventory analysis
 */
function getModel() {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
      'HTTP-Referer': 'https://karmatic.io',
      'X-Title': 'Karmatic Inventory Analyzer',
    },
  });
  
  // Use Tier 1 model for inventory analysis
  return openrouter(process.env.AI_MODEL_TIER1 || "google/gemini-2.0-flash-exp:free");
}

/**
 * Input schema for inventory analysis
 */
export const InventoryAnalysisInput = z.object({
  agency: z.object({
    name: z.string(),
    type: z.string().describe("Type of dealership (e.g., Ford dealer, multi-brand)"),
    placeId: z.string(),
  }),
  inventory: z.object({
    totalVehicles: z.number().optional(),
    categories: z.array(z.object({
      type: z.string().describe("e.g., SUV, Sedan, Truck"),
      count: z.number(),
      percentage: z.number(),
    })).optional(),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
      average: z.number(),
    }).optional(),
    brands: z.array(z.string()).optional(),
  }).optional(),
  marketData: z.object({
    averageInventorySize: z.number(),
    topSellingCategories: z.array(z.string()),
    priceComparison: z.enum(["below_market", "at_market", "above_market"]),
  }).optional(),
});

/**
 * Output schema for inventory insights
 */
export const InventoryAnalysisOutput = z.object({
  inventoryScore: z.number().min(0).max(100),
  inventoryHealth: z.enum(["excellent", "good", "fair", "poor"]),
  insights: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
  }),
  metrics: z.object({
    varietyScore: z.number().describe("Diversity of inventory 0-100"),
    priceCompetitiveness: z.enum(["very_competitive", "competitive", "average", "expensive"]),
    inventoryTurnover: z.enum(["fast", "normal", "slow", "unknown"]),
    marketAlignment: z.number().describe("How well inventory matches market demand 0-100"),
  }),
  recommendations: z.array(z.string()),
});

/**
 * System prompt for inventory analysis
 */
const INVENTORY_ANALYZER_PROMPT = `You are an automotive inventory expert. Analyze the dealership's inventory strategy.

Focus on:
1. Inventory variety and balance
2. Price competitiveness
3. Market alignment
4. Turnover optimization

Be practical and data-driven.

Output your analysis as a valid JSON object with these exact fields:
- strengths: array of 3-4 inventory strengths
- weaknesses: array of 2-3 inventory weaknesses
- opportunities: array of 2-3 market opportunities
- recommendations: array of 3-4 actionable recommendations`;

/**
 * Analyze agency inventory
 */
export async function analyzeInventory(
  input: z.infer<typeof InventoryAnalysisInput>
): Promise<z.infer<typeof InventoryAnalysisOutput>> {
  try {
    console.log("🔍 Starting inventory analysis for:", input.agency.name);
    
    // Calculate basic metrics
    const hasInventoryData = input.inventory && input.inventory.totalVehicles;
    const totalVehicles = input.inventory?.totalVehicles || 0;
    const categories = input.inventory?.categories || [];
    
    // Variety score based on category distribution
    const varietyScore = categories.length > 0
      ? Math.min(100, categories.length * 20) // More categories = higher score
      : 50; // Default if no data
    
    // Inventory health assessment
    const inventoryHealth = 
      totalVehicles > 100 && varietyScore > 80 ? "excellent" :
      totalVehicles > 50 && varietyScore > 60 ? "good" :
      totalVehicles > 20 && varietyScore > 40 ? "fair" : "poor";
    
    // Price competitiveness
    const priceComp = input.marketData?.priceComparison;
    const priceCompetitiveness = 
      priceComp === "below_market" ? "very_competitive" :
      priceComp === "at_market" ? "competitive" :
      priceComp === "above_market" ? "expensive" : "average";
    
    // Overall inventory score
    const inventoryScore = Math.round(
      (varietyScore * 0.4) + 
      (totalVehicles > 50 ? 30 : totalVehicles > 20 ? 20 : 10) +
      (priceComp === "below_market" ? 30 : priceComp === "at_market" ? 20 : 10)
    );
    
    // Generate prompt for AI analysis
    const prompt = `
Analyze this automotive dealership inventory:

Dealership: ${input.agency.name}
Type: ${input.agency.type}
Total Vehicles: ${totalVehicles || "Unknown"}

Inventory Categories:
${categories.map(c => `- ${c.type}: ${c.count} vehicles (${c.percentage}%)`).join('\n') || "No category data available"}

Price Range: ${input.inventory?.priceRange ? 
  `$${input.inventory.priceRange.min.toLocaleString()} - $${input.inventory.priceRange.max.toLocaleString()} (avg: $${input.inventory.priceRange.average.toLocaleString()})` : 
  "Unknown"}

Market Position: ${input.marketData?.priceComparison || "Unknown"}
Top Selling Categories in Market: ${input.marketData?.topSellingCategories?.join(', ') || "Unknown"}

Provide comprehensive inventory analysis.`;

    // Try AI analysis
    let aiAnalysis: any = {};
    try {
      const response = await generateText({
        model: getModel(),
        system: INVENTORY_ANALYZER_PROMPT,
        prompt,
        temperature: 0.3,
        maxTokens: 500,
      });
      
      aiAnalysis = JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI analysis error:", error);
      // Continue with fallback
    }
    
    // Market alignment calculation
    const marketAlignment = input.marketData?.topSellingCategories && categories.length > 0
      ? Math.round(
          categories
            .filter(c => input.marketData?.topSellingCategories.includes(c.type))
            .reduce((sum, c) => sum + c.percentage, 0)
        )
      : 50; // Default if no data
    
    // Combine AI insights with calculated metrics
    return {
      inventoryScore,
      inventoryHealth,
      insights: {
        strengths: aiAnalysis.strengths || [
          totalVehicles > 50 ? "Large inventory selection" : "Curated inventory selection",
          varietyScore > 60 ? "Good variety of vehicle types" : "Focused vehicle selection",
          priceCompetitiveness === "very_competitive" ? "Competitive pricing strategy" : "Market-aligned pricing",
          categories.find(c => c.type === "SUV" && c.percentage > 30) ? "Strong SUV inventory (high demand)" : "Balanced inventory mix",
        ].filter(Boolean).slice(0, 4),
        weaknesses: aiAnalysis.weaknesses || [
          totalVehicles < 30 ? "Limited inventory size" : null,
          varietyScore < 50 ? "Low variety in vehicle types" : null,
          priceCompetitiveness === "expensive" ? "Above market pricing" : null,
        ].filter(Boolean).slice(0, 3) || ["Inventory data limited"],
        opportunities: aiAnalysis.opportunities || [
          marketAlignment < 70 ? "Align inventory with top market categories" : "Maintain market-aligned inventory",
          "Expand digital inventory showcase",
          "Implement dynamic pricing strategy",
        ],
      },
      metrics: {
        varietyScore,
        priceCompetitiveness,
        inventoryTurnover: totalVehicles > 50 ? "normal" : totalVehicles > 20 ? "slow" : "unknown",
        marketAlignment,
      },
      recommendations: aiAnalysis.recommendations || [
        marketAlignment < 70 ? "Increase inventory in high-demand categories" : "Maintain current category mix",
        totalVehicles < 50 ? "Expand inventory to attract more customers" : "Optimize inventory turnover",
        "Use data analytics to predict demand trends",
        "Highlight unique inventory online",
      ],
    };
  } catch (error) {
    console.error("Inventory analysis error:", error);
    
    // Return fallback analysis
    return {
      inventoryScore: 50,
      inventoryHealth: "fair",
      insights: {
        strengths: ["Established dealership"],
        weaknesses: ["Analysis temporarily unavailable"],
        opportunities: ["Market expansion"],
      },
      metrics: {
        varietyScore: 50,
        priceCompetitiveness: "average",
        inventoryTurnover: "unknown",
        marketAlignment: 50,
      },
      recommendations: [
        "Monitor inventory performance",
        "Analyze market trends",
      ],
    };
  }
}