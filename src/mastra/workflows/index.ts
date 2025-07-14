/**
 * @fileoverview Multi-agent workflows for Karmatic AI system
 * @module mastra/workflows
 * 
 * This module defines orchestrated workflows that coordinate multiple
 * specialized agents to handle complex user requests.
 */

// Core workflow imports
import { vehicleSearchWorkflow } from "./vehicle-search-workflow";
import { dealershipAnalysisWorkflow } from "./dealership-analysis-workflow";
import { recommendationWorkflow } from "./recommendation-workflow";

// Re-export workflows
export { vehicleSearchWorkflow } from "./vehicle-search-workflow";
export { dealershipAnalysisWorkflow } from "./dealership-analysis-workflow";
export { recommendationWorkflow } from "./recommendation-workflow";

/**
 * All available workflows for registration
 */
export const karmaticWorkflows = {
  vehicleSearchWorkflow,
  dealershipAnalysisWorkflow,
  recommendationWorkflow,
} as const;

export type KarmaticWorkflowName = keyof typeof karmaticWorkflows;