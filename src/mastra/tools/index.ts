/**
 * @fileoverview Custom tools for Karmatic AI agents
 * @module mastra/tools
 * 
 * This module exports all custom tools available to Mastra agents.
 * Tools provide specific capabilities like searching dealerships,
 * analyzing vehicle data, and providing market insights.
 */

// Tool imports
import { searchDealerships } from "./search-dealerships";
import { analyzeDealership } from "./analyze-dealership";
import { getVehicleInventory } from "./get-vehicle-inventory";
import { getMarketInsights } from "./get-market-insights";
import { compareVehicles } from "./compare-vehicles";
import { saveUserPreference } from "./save-user-preference";
import { getSearchHistory } from "./get-search-history";
import { generateRecommendations } from "./generate-recommendations";

// Re-export tools
// Search and discovery tools
export { searchDealerships } from "./search-dealerships";
export { analyzeDealership } from "./analyze-dealership";
export { getVehicleInventory } from "./get-vehicle-inventory";

// Market and analysis tools
export { getMarketInsights } from "./get-market-insights";
export { compareVehicles } from "./compare-vehicles";

// User interaction tools
export { saveUserPreference } from "./save-user-preference";
export { getSearchHistory } from "./get-search-history";
export { generateRecommendations } from "./generate-recommendations";

/**
 * All available tools for registration with agents
 */
export const karmaticTools = {
  // Search tools
  searchDealerships,
  analyzeDealership,
  getVehicleInventory,
  
  // Market tools
  getMarketInsights,
  compareVehicles,
  
  // User tools
  saveUserPreference,
  getSearchHistory,
  generateRecommendations,
} as const;

export type KarmaticToolName = keyof typeof karmaticTools;