/**
 * @fileoverview Dealership analysis workflow with specialized evaluation agents
 * @module mastra/workflows/dealership-analysis-workflow
 */

import { Workflow, WorkflowStep } from "@mastra/core/workflow";
import { Agent } from "@mastra/core/agent";
import { getDefaultModel } from "../config/llm-providers";
import { getMemoryStore } from "../config/memory-store";
import { karmaticTools } from "../tools";
import { z } from "zod";

/**
 * Input schema for dealership analysis workflow
 */
const dealershipAnalysisInputSchema = z.object({
  dealerships: z.array(z.object({
    placeId: z.string(),
    name: z.string(),
    location: z.string().optional(),
  })).describe("List of dealerships to analyze"),
  
  analysisType: z.enum(["basic", "comprehensive", "comparison"]).default("comprehensive")
    .describe("Type of analysis to perform"),
  
  criteria: z.array(z.enum([
    "reputation",
    "services", 
    "inventory",
    "pricing",
    "customer_experience",
    "location_convenience"
  ])).optional().describe("Specific criteria to focus analysis on"),
  
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
  }).optional(),
});

/**
 * Reputation Analysis Agent
 * Specializes in evaluating dealership reputation and customer satisfaction
 */
const reputationAnalyst = new Agent({
  name: "Reputation Analyst",
  instructions: `
You are a dealership reputation specialist. Your expertise includes:

1. Analyzing customer reviews and ratings
2. Evaluating customer satisfaction patterns
3. Identifying reputation strengths and weaknesses
4. Assessing trustworthiness and reliability indicators

Focus on providing insights about customer experience and reputation quality.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    analyzeDealership: karmaticTools.analyzeDealership,
  },
});

/**
 * Service Analysis Agent
 * Evaluates dealership services and capabilities
 */
const serviceAnalyst = new Agent({
  name: "Service Analyst", 
  instructions: `
You are a dealership service evaluation specialist. You analyze:

1. Available services (sales, service, parts, financing)
2. Service quality and efficiency
3. Operational capabilities and hours
4. Specialized services and certifications

Provide detailed insights about what services each dealership offers and their quality.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    analyzeDealership: karmaticTools.analyzeDealership,
    getVehicleInventory: karmaticTools.getVehicleInventory,
  },
});

/**
 * Comparison Coordinator Agent
 * Synthesizes analysis from other agents and creates comparisons
 */
const comparisonCoordinator = new Agent({
  name: "Comparison Coordinator",
  instructions: `
You are a dealership comparison specialist. Your role is to:

1. Synthesize analysis from reputation and service specialists
2. Create clear, actionable comparisons between dealerships
3. Highlight key differentiators and advantages
4. Provide final recommendations based on user criteria

Focus on making complex analyses easy to understand and actionable.
  `,
  model: getDefaultModel(),
  memory: getMemoryStore(),
  tools: {
    generateRecommendations: karmaticTools.generateRecommendations,
  },
});

/**
 * Workflow Steps
 */

const reputationAnalysis: WorkflowStep = {
  id: "reputation-analysis",
  description: "Analyze dealership reputation and customer satisfaction",
  agent: reputationAnalyst,
  execute: async (input: any) => {
    const { dealerships, criteria } = input;
    
    const reputationResults = await Promise.all(
      dealerships.map(async (dealership: any) => {
        const analysis = await reputationAnalyst.generate(
          `Analyze the reputation and customer satisfaction for ${dealership.name} (Place ID: ${dealership.placeId}). 
          
          Focus on:
          - Customer reviews and ratings
          - Review patterns and trends
          - Customer satisfaction indicators
          - Reputation strengths and concerns
          
          Include detailed review analysis if available.`,
          input.context
        );
        
        return {
          dealership: dealership.name,
          placeId: dealership.placeId,
          reputationAnalysis: analysis.text,
        };
      })
    );
    
    return {
      ...input,
      reputationResults,
    };
  },
};

const serviceAnalysis: WorkflowStep = {
  id: "service-analysis", 
  description: "Analyze dealership services and capabilities",
  agent: serviceAnalyst,
  execute: async (input: any) => {
    const { dealerships, criteria } = input;
    
    const serviceResults = await Promise.all(
      dealerships.map(async (dealership: any) => {
        const analysis = await serviceAnalyst.generate(
          `Analyze the services and capabilities of ${dealership.name} (Place ID: ${dealership.placeId}).
          
          Evaluate:
          - Available services (sales, service, parts, financing)
          - Operating hours and convenience
          - Service quality indicators
          - Inventory and vehicle availability
          - Special certifications or programs
          
          Provide a comprehensive service capability assessment.`,
          input.context
        );
        
        return {
          dealership: dealership.name,
          placeId: dealership.placeId,
          serviceAnalysis: analysis.text,
        };
      })
    );
    
    return {
      ...input,
      serviceResults,
    };
  },
};

const comprehensiveComparison: WorkflowStep = {
  id: "comprehensive-comparison",
  description: "Create comprehensive comparison and recommendations",
  agent: comparisonCoordinator,
  execute: async (input: any) => {
    const { dealerships, analysisType, criteria, reputationResults, serviceResults } = input;
    
    // Combine analysis results
    const combinedAnalysis = dealerships.map((dealership: any) => {
      const reputation = reputationResults.find((r: any) => r.placeId === dealership.placeId);
      const service = serviceResults.find((s: any) => s.placeId === dealership.placeId);
      
      return {
        dealership: dealership.name,
        location: dealership.location,
        placeId: dealership.placeId,
        reputation: reputation?.reputationAnalysis,
        services: service?.serviceAnalysis,
      };
    });
    
    const comparison = await comparisonCoordinator.generate(
      `Create a comprehensive comparison of these ${dealerships.length} dealerships:
      
      Analysis Type: ${analysisType}
      ${criteria ? `Focus Criteria: ${criteria.join(', ')}` : ''}
      
      Dealership Analysis Results:
      ${combinedAnalysis.map((d: any, i: number) => `
      ${i + 1}. ${d.dealership} ${d.location ? `(${d.location})` : ''}
      
      Reputation Analysis:
      ${d.reputation}
      
      Service Analysis:
      ${d.services}
      `).join('\n')}
      
      Provide:
      1. Clear comparison matrix of key differentiators
      2. Strengths and weaknesses of each dealership
      3. Best use cases for each dealership
      4. Final ranking and recommendations
      5. Actionable next steps for the user`,
      input.context
    );
    
    return {
      success: true,
      analysisType,
      criteria,
      dealerships: combinedAnalysis,
      comparison: comparison.text,
      summary: `Comprehensive analysis completed for ${dealerships.length} dealerships`,
    };
  },
};

/**
 * Dealership Analysis Workflow Definition
 * 
 * This workflow provides comprehensive dealership analysis using
 * specialized agents for reputation, services, and comparative evaluation.
 */
export const dealershipAnalysisWorkflow = new Workflow({
  id: "dealership-analysis-workflow",
  description: "Comprehensive dealership analysis with reputation and service evaluation",
  inputSchema: dealershipAnalysisInputSchema,
  
  steps: [
    reputationAnalysis,
    serviceAnalysis,
    comprehensiveComparison,
  ],
  
  // Execute reputation and service analysis in parallel, then comparison
  stepDependencies: {
    "comprehensive-comparison": ["reputation-analysis", "service-analysis"],
  },
});