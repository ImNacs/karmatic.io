/**
 * @fileoverview Vehicle search workflow with multiple specialized agents
 * @module mastra/workflows/vehicle-search-workflow
 */

import { Workflow, WorkflowStep } from "@mastra/core/workflow";
import { Agent } from "@mastra/core/agent";
import { getDefaultModel } from "../config/llm-providers";
import { getMemoryStore } from "../config/memory-store";
import { karmaticTools } from "../tools";
import { z } from "zod";

/**
 * Input schema for vehicle search workflow
 */
const vehicleSearchInputSchema = z.object({
  location: z.string().describe("Location to search for vehicles"),
  preferences: z.object({
    vehicleType: z.string().optional(),
    brand: z.string().optional(),
    budget: z.number().optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
  }).optional(),
});

/**
 * Search Coordinator Agent
 * Orchestrates the overall search process and coordinates other agents
 */
const searchCoordinator = new Agent({
  name: "Search Coordinator",
  instructions: `
You are a search coordinator for vehicle searches. Your role is to:

1. Analyze user requirements and break them down into actionable tasks
2. Coordinate with specialized agents to gather comprehensive information
3. Synthesize results from multiple agents into a coherent response
4. Ensure all user needs are addressed

Always start by understanding the user's core requirements, then delegate to appropriate specialist agents.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    searchDealerships: karmaticTools.searchDealerships,
    saveUserPreference: karmaticTools.saveUserPreference,
    generateRecommendations: karmaticTools.generateRecommendations,
  },
});

/**
 * Market Analysis Agent
 * Specializes in market conditions and pricing insights
 */
const marketAnalyst = new Agent({
  name: "Market Analyst",
  instructions: `
You are a vehicle market analyst. Your expertise includes:

1. Local market conditions and trends
2. Pricing analysis and market timing
3. Inventory availability insights
4. Competitive analysis between dealerships

Provide data-driven insights to help users make informed decisions about timing and pricing.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    getMarketInsights: karmaticTools.getMarketInsights,
    compareVehicles: karmaticTools.compareVehicles,
  },
});

/**
 * Dealership Specialist Agent
 * Focuses on dealership analysis and recommendations
 */
const dealershipSpecialist = new Agent({
  name: "Dealership Specialist", 
  instructions: `
You are a dealership evaluation specialist. You excel at:

1. Analyzing dealership quality, reputation, and services
2. Comparing dealership offerings and customer experience
3. Evaluating inventory and availability
4. Assessing dealership-specific advantages

Focus on helping users find the best dealership match for their needs.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    analyzeDealership: karmaticTools.analyzeDealership,
    getVehicleInventory: karmaticTools.getVehicleInventory,
    searchDealerships: karmaticTools.searchDealerships,
  },
});

/**
 * Vehicle Search Workflow Steps
 */

const requirementAnalysis: WorkflowStep = {
  id: "requirement-analysis",
  description: "Analyze user requirements and preferences",
  agent: searchCoordinator,
  execute: async (input: any) => {
    const { location, preferences, context } = input;
    
    // Save user preferences for future use
    if (preferences) {
      const preferencePromises = [];
      
      if (preferences.vehicleType) {
        preferencePromises.push(
          searchCoordinator.generate(`Save user preference: vehicle type "${preferences.vehicleType}"`, {
            threadId: context?.sessionId,
            resourceId: context?.userId,
          })
        );
      }
      
      if (preferences.brand) {
        preferencePromises.push(
          searchCoordinator.generate(`Save user preference: brand "${preferences.brand}"`, {
            threadId: context?.sessionId,
            resourceId: context?.userId,
          })
        );
      }
      
      if (preferences.budget) {
        preferencePromises.push(
          searchCoordinator.generate(`Save user preference: budget range "$${preferences.budget}"`, {
            threadId: context?.sessionId,
            resourceId: context?.userId,
          })
        );
      }
      
      await Promise.all(preferencePromises);
    }
    
    // Analyze requirements and create search strategy
    const analysis = await searchCoordinator.generate(
      `Analyze the following vehicle search request and create a search strategy:
      
      Location: ${location}
      Preferences: ${JSON.stringify(preferences, null, 2)}
      
      Provide a structured analysis of what the user needs and how to best help them.`,
      {
        threadId: context?.sessionId,
        resourceId: context?.userId,
      }
    );
    
    return {
      analysis: analysis.text,
      location,
      preferences,
      context,
    };
  },
};

const marketAnalysis: WorkflowStep = {
  id: "market-analysis",
  description: "Analyze market conditions for the search location",
  agent: marketAnalyst,
  execute: async (input: any) => {
    const { location, preferences } = input;
    
    const marketInsights = await marketAnalyst.generate(
      `Analyze the vehicle market in ${location}. Consider:
      - Current market conditions
      - Pricing trends
      - Inventory levels
      - Best timing for purchases
      ${preferences?.vehicleType ? `- Specific insights for ${preferences.vehicleType} vehicles` : ''}
      ${preferences?.brand ? `- Market conditions for ${preferences.brand}` : ''}
      
      Provide actionable market insights to help with the vehicle search.`,
      input.context
    );
    
    return {
      ...input,
      marketInsights: marketInsights.text,
    };
  },
};

const dealershipSearch: WorkflowStep = {
  id: "dealership-search",
  description: "Find and analyze relevant dealerships",
  agent: dealershipSpecialist,
  execute: async (input: any) => {
    const { location, preferences } = input;
    
    const dealershipAnalysis = await dealershipSpecialist.generate(
      `Search for vehicle dealerships in ${location} that match these criteria:
      ${preferences?.vehicleType ? `- Vehicle type: ${preferences.vehicleType}` : ''}
      ${preferences?.brand ? `- Brand: ${preferences.brand}` : ''}
      ${preferences?.budget ? `- Budget consideration: $${preferences.budget}` : ''}
      
      Find the best dealerships and provide detailed analysis of the top options.`,
      input.context
    );
    
    return {
      ...input,
      dealershipAnalysis: dealershipAnalysis.text,
    };
  },
};

const synthesisAndRecommendations: WorkflowStep = {
  id: "synthesis-recommendations",
  description: "Synthesize all findings and generate comprehensive recommendations",
  agent: searchCoordinator,
  execute: async (input: any) => {
    const { location, preferences, marketInsights, dealershipAnalysis } = input;
    
    const finalRecommendations = await searchCoordinator.generate(
      `Based on all the analysis, provide comprehensive recommendations for this vehicle search:
      
      Location: ${location}
      User Preferences: ${JSON.stringify(preferences, null, 2)}
      
      Market Analysis:
      ${marketInsights}
      
      Dealership Analysis:
      ${dealershipAnalysis}
      
      Generate personalized, actionable recommendations that synthesize all this information.`,
      input.context
    );
    
    return {
      success: true,
      location,
      preferences,
      insights: {
        market: marketInsights,
        dealerships: dealershipAnalysis,
      },
      recommendations: finalRecommendations.text,
      summary: `Comprehensive vehicle search analysis completed for ${location}`,
    };
  },
};

/**
 * Vehicle Search Workflow Definition
 * 
 * This workflow coordinates multiple agents to provide comprehensive
 * vehicle search assistance including market analysis, dealership evaluation,
 * and personalized recommendations.
 */
export const vehicleSearchWorkflow = new Workflow({
  id: "vehicle-search-workflow",
  description: "Comprehensive vehicle search with market analysis and dealership evaluation",
  inputSchema: vehicleSearchInputSchema,
  
  steps: [
    requirementAnalysis,
    marketAnalysis,
    dealershipSearch,
    synthesisAndRecommendations,
  ],
  
  // Execute steps in sequence
  stepDependencies: {
    "market-analysis": ["requirement-analysis"],
    "dealership-search": ["requirement-analysis"],
    "synthesis-recommendations": ["market-analysis", "dealership-search"],
  },
});