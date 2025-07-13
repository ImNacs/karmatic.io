/**
 * @fileoverview Tool for saving user preferences to memory
 * @module mastra/tools/save-user-preference
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for user preference parameters
 */
const saveUserPreferenceSchema = z.object({
  category: z.enum([
    "vehicle_type",
    "brand_preference", 
    "budget_range",
    "location",
    "features",
    "search_preferences"
  ]).describe("Category of preference to save"),
  
  preference: z.string().describe("The specific preference value to save"),
  priority: z.enum(["low", "medium", "high"]).default("medium").describe("Priority level of this preference"),
  notes: z.string().optional().describe("Additional notes about this preference"),
});

/**
 * Tool for saving user preferences to working memory
 * 
 * This tool helps maintain user context across conversations
 * by storing preferences that can inform future recommendations.
 */
export const saveUserPreference = createTool({
  id: "save-user-preference", 
  description: "Save user preferences for vehicles, budget, location, or search criteria to personalize future interactions",
  inputSchema: saveUserPreferenceSchema,
  
  execute: async ({ category, preference, priority, notes }) => {
    try {
      // This tool primarily serves to signal to the agent that a preference
      // should be saved to working memory. The actual saving happens through
      // the working memory system automatically.
      
      const preferenceData = {
        category,
        value: preference,
        priority,
        notes,
        savedAt: new Date().toISOString(),
      };
      
      // Generate a user-friendly message about what was saved
      const categoryDisplayNames = {
        vehicle_type: "Vehicle Type Preference",
        brand_preference: "Brand Preference", 
        budget_range: "Budget Range",
        location: "Location Preference",
        features: "Feature Preference",
        search_preferences: "Search Preference"
      };
      
      const displayName = categoryDisplayNames[category] || category;
      
      // Provide guidance on how this preference will be used
      const usageGuidance = {
        vehicle_type: "This will help me recommend relevant vehicles and dealerships that specialize in this type.",
        brand_preference: "I'll prioritize this brand in future searches and recommendations.",
        budget_range: "I'll filter results to match your budget and suggest appropriate options.",
        location: "I'll use this as your default search location for future queries.",
        features: "I'll highlight vehicles and dealerships that offer these features.",
        search_preferences: "I'll remember these preferences for future searches."
      };
      
      return {
        success: true,
        preference: preferenceData,
        message: `Saved your ${displayName.toLowerCase()}: "${preference}" with ${priority} priority.`,
        guidance: usageGuidance[category],
        summary: `Your preference for ${displayName.toLowerCase()} has been saved and will be used to personalize future vehicle searches and recommendations.`,
      };
      
    } catch (error) {
      console.error('Save preference error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown preference save error',
        category,
        preference,
      };
    }
  },
});