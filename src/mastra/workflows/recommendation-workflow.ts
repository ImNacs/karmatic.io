/**
 * @fileoverview Personalized recommendation workflow with context-aware agents
 * @module mastra/workflows/recommendation-workflow
 */

import { Workflow, WorkflowStep } from "@mastra/core/workflow";
import { Agent } from "@mastra/core/agent";
import { getDefaultModel } from "../config/llm-providers";
import { getMemoryStore } from "../config/memory-store";
import { karmaticTools } from "../tools";
import { z } from "zod";

/**
 * Input schema for recommendation workflow
 */
const recommendationInputSchema = z.object({
  userContext: z.object({
    location: z.string().optional(),
    preferences: z.object({
      vehicleType: z.string().optional(),
      brand: z.string().optional(),
      budget: z.number().optional(),
      features: z.array(z.string()).optional(),
      priority: z.enum(["budget", "quality", "convenience", "features"]).optional(),
    }).optional(),
    searchHistory: z.boolean().default(true).describe("Whether to include search history in recommendations"),
  }),
  
  recommendationType: z.enum([
    "next_steps",
    "vehicle_suggestions", 
    "dealership_suggestions",
    "market_timing",
    "comprehensive"
  ]).default("comprehensive").describe("Type of recommendations to generate"),
  
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
  }).optional(),
});

/**
 * Context Analysis Agent
 * Specializes in understanding user context and history
 */
const contextAnalyst = new Agent({
  name: "Context Analyst",
  instructions: `
You are a user context analysis specialist. Your role is to:

1. Analyze user search history and behavior patterns
2. Understand user preferences and priorities
3. Identify context clues from conversation history
4. Build comprehensive user profiles for personalization

Use search history and conversation context to understand what the user really needs.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    getSearchHistory: karmaticTools.getSearchHistory,
    saveUserPreference: karmaticTools.saveUserPreference,
  },
});

/**
 * Strategy Advisor Agent
 * Provides strategic advice and next steps
 */
const strategyAdvisor = new Agent({
  name: "Strategy Advisor",
  instructions: `
You are a vehicle buying strategy advisor. Your expertise includes:

1. Optimal search and buying strategies
2. Market timing and negotiation advice
3. Decision-making frameworks
4. Action prioritization and planning

Provide strategic, actionable advice that helps users make smart decisions.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    getMarketInsights: karmaticTools.getMarketInsights,
    generateRecommendations: karmaticTools.generateRecommendations,
  },
});

/**
 * Personalization Engine Agent
 * Creates highly personalized recommendations
 */
const personalizationEngine = new Agent({
  name: "Personalization Engine",
  instructions: `
You are a personalization specialist for vehicle recommendations. You excel at:

1. Creating tailored recommendations based on user context
2. Matching users with perfect dealerships and vehicles
3. Personalizing advice based on individual preferences
4. Balancing multiple user priorities and constraints

Always consider the user's complete context, history, and stated preferences.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    generateRecommendations: karmaticTools.generateRecommendations,
    compareVehicles: karmaticTools.compareVehicles,
    searchDealerships: karmaticTools.searchDealerships,
  },
});

/**
 * Workflow Steps
 */

const contextualAnalysis: WorkflowStep = {
  id: "contextual-analysis",
  description: "Analyze user context, history, and preferences",
  agent: contextAnalyst,
  execute: async (input: any) => {
    const { userContext, recommendationType } = input;
    
    let contextAnalysis = "";
    
    // Get search history if requested
    if (userContext.searchHistory) {
      contextAnalysis = await contextAnalyst.generate(
        `Analyze the user's context for personalized recommendations:
        
        Current Context:
        ${JSON.stringify(userContext, null, 2)}
        
        Recommendation Type: ${recommendationType}
        
        Please:
        1. Retrieve and analyze the user's search history
        2. Identify patterns and preferences
        3. Understand the user's current needs and priorities
        4. Build a comprehensive context profile
        
        Provide insights that will help create highly personalized recommendations.`,
        input.context
      );
    } else {
      contextAnalysis = await contextAnalyst.generate(
        `Analyze the user's current context for recommendations:
        ${JSON.stringify(userContext, null, 2)}
        
        Based on this context, identify the user's likely needs and preferences.`,
        input.context
      );
    }
    
    return {
      ...input,
      contextAnalysis: contextAnalysis,
    };
  },
};

const strategicRecommendations: WorkflowStep = {
  id: "strategic-recommendations",
  description: "Generate strategic advice and next steps",
  agent: strategyAdvisor,
  execute: async (input: any) => {
    const { userContext, recommendationType, contextAnalysis } = input;
    
    const strategicAdvice = await strategyAdvisor.generate(
      `Based on the user context analysis, provide strategic recommendations:
      
      User Context: ${JSON.stringify(userContext, null, 2)}
      Recommendation Type: ${recommendationType}
      
      Context Analysis:
      ${contextAnalysis}
      
      Provide strategic advice including:
      1. Optimal search and buying strategy
      2. Market timing considerations
      3. Priority action items
      4. Decision-making framework
      5. Timeline and next steps
      
      Focus on actionable, strategic guidance.`,
      input.context
    );
    
    return {
      ...input,
      strategicAdvice,
    };
  },
};

const personalizedRecommendations: WorkflowStep = {
  id: "personalized-recommendations",
  description: "Create highly personalized recommendations",
  agent: personalizationEngine,
  execute: async (input: any) => {
    const { userContext, recommendationType, contextAnalysis, strategicAdvice } = input;
    
    const personalizedRecs = await personalizationEngine.generate(
      `Create highly personalized recommendations based on all available context:
      
      User Context: ${JSON.stringify(userContext, null, 2)}
      Recommendation Type: ${recommendationType}
      
      Context Analysis:
      ${contextAnalysis}
      
      Strategic Advice:
      ${strategicAdvice}
      
      Generate comprehensive, personalized recommendations that include:
      1. Specific vehicle suggestions matched to user preferences
      2. Dealership recommendations based on user priorities
      3. Personalized search strategies
      4. Customized next steps
      5. Alternative options and fallbacks
      
      Make recommendations specific, actionable, and perfectly tailored to this user.`,
      input.context
    );
    
    return {
      success: true,
      userContext,
      recommendationType,
      analysis: {
        context: contextAnalysis,
        strategy: strategicAdvice,
      },
      recommendations: personalizedRecs,
      summary: `Personalized ${recommendationType} recommendations generated based on user context and preferences`,
    };
  },
};

/**
 * Recommendation Workflow Definition
 * 
 * This workflow creates highly personalized recommendations by analyzing
 * user context, search history, and preferences through specialized agents.
 */
export const recommendationWorkflow = new Workflow({
  id: "recommendation-workflow",
  description: "Personalized recommendation engine with context analysis and strategic advice",
  inputSchema: recommendationInputSchema,
  
  steps: [
    contextualAnalysis,
    strategicRecommendations,
    personalizedRecommendations,
  ],
  
  // Execute context analysis first, then strategy and personalization can run in parallel
  stepDependencies: {
    "strategic-recommendations": ["contextual-analysis"],
    "personalized-recommendations": ["contextual-analysis", "strategic-recommendations"],
  },
});