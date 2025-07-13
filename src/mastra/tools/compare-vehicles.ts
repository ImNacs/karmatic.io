/**
 * @fileoverview Tool for comparing vehicles across different criteria
 * @module mastra/tools/compare-vehicles
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for vehicle comparison parameters
 */
const compareVehiclesSchema = z.object({
  vehicles: z.array(z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    trim: z.string().optional(),
  })).min(2).max(4).describe("List of 2-4 vehicles to compare"),
  
  comparisonCriteria: z.array(z.enum([
    "price",
    "fuel_efficiency", 
    "safety_rating",
    "reliability",
    "features",
    "performance",
    "dimensions",
    "warranty"
  ])).default(["price", "fuel_efficiency", "safety_rating", "reliability"]).describe("Criteria to compare vehicles on"),
});

/**
 * Tool for comparing multiple vehicles across various criteria
 * 
 * This tool provides detailed comparisons to help users make
 * informed decisions between different vehicle options.
 */
export const compareVehicles = createTool({
  id: "compare-vehicles",
  description: "Compare multiple vehicles across various criteria like price, fuel efficiency, safety, and features",
  inputSchema: compareVehiclesSchema,
  
  execute: async ({ vehicles, comparisonCriteria }) => {
    try {
      // Mock vehicle database - in production this would query real vehicle data APIs
      const vehicleDatabase = {
        "Honda Civic 2024": {
          price: { msrp: 25000, typical: 24500 },
          fuel_efficiency: { city: 28, highway: 36, combined: 32 },
          safety_rating: { nhtsa: 5, iihs: "Top Safety Pick" },
          reliability: { score: 8.5, rank: "Above Average" },
          features: ["Apple CarPlay", "Honda Sensing", "Adaptive Cruise Control"],
          performance: { horsepower: 180, torque: 177, transmission: "CVT" },
          dimensions: { length: 184.0, width: 70.9, height: 55.7, cargo: 14.8 },
          warranty: { basic: "3yr/36k", powertrain: "5yr/60k" }
        },
        "Toyota Camry 2024": {
          price: { msrp: 27000, typical: 26200 },
          fuel_efficiency: { city: 28, highway: 39, combined: 32 },
          safety_rating: { nhtsa: 5, iihs: "Top Safety Pick+" },
          reliability: { score: 9.0, rank: "Excellent" },
          features: ["Toyota Safety Sense", "Wireless Charging", "LED Headlights"],
          performance: { horsepower: 203, torque: 184, transmission: "8-Speed Auto" },
          dimensions: { length: 192.7, width: 72.4, height: 56.9, cargo: 15.1 },
          warranty: { basic: "3yr/36k", powertrain: "5yr/60k" }
        },
        "Honda CR-V 2024": {
          price: { msrp: 32000, typical: 31200 },
          fuel_efficiency: { city: 28, highway: 34, combined: 31 },
          safety_rating: { nhtsa: 5, iihs: "Top Safety Pick" },
          reliability: { score: 8.7, rank: "Above Average" },
          features: ["AWD Available", "Honda Sensing", "Hands-Free Tailgate"],
          performance: { horsepower: 190, torque: 179, transmission: "CVT" },
          dimensions: { length: 185.0, width: 73.0, height: 66.1, cargo: 39.2 },
          warranty: { basic: "3yr/36k", powertrain: "5yr/60k" }
        },
        "Ford F-150 2024": {
          price: { msrp: 38000, typical: 37000 },
          fuel_efficiency: { city: 20, highway: 24, combined: 22 },
          safety_rating: { nhtsa: 5, iihs: "Good" },
          reliability: { score: 7.5, rank: "Average" },
          features: ["Ford Co-Pilot360", "Pro Trailer Backup", "Mobile Hotspot"],
          performance: { horsepower: 290, torque: 265, transmission: "10-Speed Auto" },
          dimensions: { length: 209.3, width: 79.9, height: 75.0, cargo: 52.8 },
          warranty: { basic: "3yr/36k", powertrain: "5yr/60k" }
        }
      };
      
      // Build comparison data
      const comparisonResults = vehicles.map(vehicle => {
        const key = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
        const data = vehicleDatabase[key];
        
        if (!data) {
          return {
            vehicle,
            error: "Vehicle data not available",
            available: false
          };
        }
        
        // Extract only requested criteria
        const criteriaData = {};
        comparisonCriteria.forEach(criteria => {
          if (data[criteria]) {
            criteriaData[criteria] = data[criteria];
          }
        });
        
        return {
          vehicle,
          data: criteriaData,
          available: true
        };
      });
      
      // Generate comparison analysis
      const analysis = {
        overview: `Comparing ${vehicles.length} vehicles across ${comparisonCriteria.length} criteria`,
        
        winners: comparisonCriteria.reduce((acc, criteria) => {
          const validVehicles = comparisonResults.filter(v => v.available && v.data[criteria]);
          
          if (validVehicles.length === 0) return acc;
          
          let winner;
          switch (criteria) {
            case "price":
              winner = validVehicles.reduce((min, current) => 
                current.data.price.typical < min.data.price.typical ? current : min
              );
              break;
            case "fuel_efficiency":
              winner = validVehicles.reduce((best, current) => 
                current.data.fuel_efficiency.combined > best.data.fuel_efficiency.combined ? current : best
              );
              break;
            case "safety_rating":
              winner = validVehicles.reduce((best, current) => 
                current.data.safety_rating.nhtsa > best.data.safety_rating.nhtsa ? current : best
              );
              break;
            case "reliability":
              winner = validVehicles.reduce((best, current) => 
                current.data.reliability.score > best.data.reliability.score ? current : best
              );
              break;
            case "performance":
              winner = validVehicles.reduce((best, current) => 
                current.data.performance.horsepower > best.data.performance.horsepower ? current : best
              );
              break;
            default:
              winner = validVehicles[0];
          }
          
          acc[criteria] = {
            winner: `${winner.vehicle.make} ${winner.vehicle.model}`,
            reason: getWinnerReason(criteria, winner)
          };
          
          return acc;
        }, {}),
        
        recommendations: generateRecommendations(comparisonResults, comparisonCriteria)
      };
      
      return {
        success: true,
        comparison: {
          vehicles: comparisonResults,
          criteria: comparisonCriteria,
          analysis
        },
        summary: `Compared ${vehicles.length} vehicles. ${analysis.recommendations.overall}`,
      };
      
    } catch (error) {
      console.error('Vehicle comparison error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown comparison error',
        vehicles,
      };
    }
  },
});

/**
 * Helper function to generate winner reasons
 */
function getWinnerReason(criteria: string, winner: any): string {
  switch (criteria) {
    case "price":
      return `Lowest typical price at $${winner.data.price.typical.toLocaleString()}`;
    case "fuel_efficiency":
      return `Best combined MPG at ${winner.data.fuel_efficiency.combined} MPG`;
    case "safety_rating":
      return `Highest NHTSA rating of ${winner.data.safety_rating.nhtsa} stars`;
    case "reliability":
      return `Highest reliability score of ${winner.data.reliability.score}/10`;
    case "performance":
      return `Most horsepower at ${winner.data.performance.horsepower} HP`;
    default:
      return "Best in category";
  }
}

/**
 * Helper function to generate recommendations
 */
function generateRecommendations(results: any[], criteria: string[]): any {
  const available = results.filter(r => r.available);
  
  if (available.length === 0) {
    return { overall: "No vehicle data available for comparison." };
  }
  
  const recommendations = [];
  
  // Find best overall value
  if (criteria.includes("price") && criteria.includes("reliability")) {
    const bestValue = available.find(v => 
      v.data.reliability?.score >= 8.0 && v.data.price?.typical <= 30000
    );
    if (bestValue) {
      recommendations.push(`Best value: ${bestValue.vehicle.make} ${bestValue.vehicle.model} combines good reliability with reasonable pricing.`);
    }
  }
  
  // Find most practical
  if (criteria.includes("fuel_efficiency") && criteria.includes("safety_rating")) {
    const mostPractical = available.find(v =>
      v.data.fuel_efficiency?.combined >= 30 && v.data.safety_rating?.nhtsa >= 5
    );
    if (mostPractical) {
      recommendations.push(`Most practical: ${mostPractical.vehicle.make} ${mostPractical.vehicle.model} offers excellent fuel economy and top safety ratings.`);
    }
  }
  
  return {
    overall: recommendations.length > 0 ? recommendations[0] : "All vehicles have their strengths - choose based on your priorities.",
    detailed: recommendations
  };
}