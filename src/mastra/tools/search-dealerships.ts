/**
 * @fileoverview Tool for searching dealerships/agencies
 * @module mastra/tools/search-dealerships
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for dealership search parameters
 */
const searchDealershipsSchema = z.object({
  location: z.string().describe("Location to search for dealerships (city, address, or coordinates)"),
  brand: z.string().optional().describe("Specific vehicle brand to filter by (e.g., Honda, Toyota, Ford)"),
  radius: z.number().default(25).describe("Search radius in kilometers"),
  services: z.array(z.string()).optional().describe("Required services (e.g., 'sales', 'service', 'parts')"),
  minRating: z.number().min(1).max(5).optional().describe("Minimum rating filter (1-5 stars)"),
});

/**
 * Tool for searching dealerships in a specific location
 * 
 * This tool integrates with the existing search system to find
 * relevant dealerships based on user criteria.
 */
export const searchDealerships = createTool({
  id: "search-dealerships",
  description: "Search for vehicle dealerships and agencies in a specific location with optional filters",
  inputSchema: searchDealershipsSchema,
  
  execute: async (context) => {
    const { location, brand, radius, services, minRating } = context.context;
    try {
      // Call the existing search API
      const searchParams = new URLSearchParams({
        location,
        ...(brand && { query: brand }),
        ...(radius && { radius: radius.toString() }),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/dealerships?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const results = await response.json();
      
      // Apply client-side filters
      let filteredResults = results.agencies || [];
      
      if (services && services.length > 0) {
        filteredResults = filteredResults.filter((agency: any) => {
          const agencyServices = agency.types || [];
          return services.some(service => 
            agencyServices.some((type: string) => 
              type.toLowerCase().includes(service.toLowerCase())
            )
          );
        });
      }
      
      if (minRating) {
        filteredResults = filteredResults.filter((agency: any) => 
          (agency.rating || 0) >= minRating
        );
      }
      
      // Format results for agent consumption
      const formattedResults = filteredResults.slice(0, 10).map((agency: any) => ({
        name: agency.name,
        address: agency.vicinity || agency.formatted_address,
        rating: agency.rating,
        priceLevel: agency.price_level,
        types: agency.types,
        placeId: agency.place_id,
        isOpen: agency.opening_hours?.open_now,
        totalRatings: agency.user_ratings_total,
      }));
      
      return {
        success: true,
        location,
        searchCriteria: { brand, radius, services, minRating },
        totalFound: filteredResults.length,
        results: formattedResults,
        summary: `Found ${formattedResults.length} dealerships in ${location}${brand ? ` for ${brand}` : ''}`,
      };
      
    } catch (error) {
      console.error('Dealership search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error',
        location,
        results: [],
      };
    }
  },
});