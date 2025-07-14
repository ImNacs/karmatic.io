/**
 * @fileoverview Tool for retrieving user search history
 * @module mastra/tools/get-search-history
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for search history parameters
 */
const getSearchHistorySchema = z.object({
  limit: z.number().min(1).max(20).default(10).describe("Maximum number of recent searches to retrieve"),
  includeDetails: z.boolean().default(false).describe("Whether to include detailed search results"),
  filterBy: z.object({
    location: z.string().optional(),
    brand: z.string().optional(),
    dateRange: z.enum(["today", "week", "month", "all"]).default("all").optional(),
  }).optional().describe("Filters to apply to search history"),
});

/**
 * Tool for retrieving user's search history
 * 
 * This tool accesses the user's previous searches to provide
 * context and help with follow-up questions or recommendations.
 */
export const getSearchHistory = createTool({
  id: "get-search-history",
  description: "Retrieve user's recent search history to provide context and personalized recommendations",
  inputSchema: getSearchHistorySchema,
  
  execute: async (context) => {
    const { limit, includeDetails, filterBy } = context.context;
    try {
      // Call the existing search history API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/history`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch search history: ${response.statusText}`);
      }
      
      const historyData = await response.json();
      let searches = historyData.searches || [];
      
      // Flatten search groups into individual searches
      const allSearches = searches.flatMap((group: any) => 
        (group.searches || []).map((search: any) => ({
          ...search,
          groupLabel: group.label,
        }))
      );
      
      // Apply filters
      let filteredSearches = allSearches;
      
      if (filterBy?.location) {
        filteredSearches = filteredSearches.filter((search: any) => 
          search.location?.toLowerCase().includes(filterBy.location!.toLowerCase())
        );
      }
      
      if (filterBy?.brand) {
        filteredSearches = filteredSearches.filter((search: any) => 
          search.query?.toLowerCase().includes(filterBy.brand!.toLowerCase())
        );
      }
      
      if (filterBy?.dateRange && filterBy.dateRange !== "all") {
        const now = new Date();
        let cutoffDate: Date;
        
        switch (filterBy.dateRange) {
          case "today":
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            cutoffDate = new Date(0);
        }
        
        filteredSearches = filteredSearches.filter((search: any) => 
          new Date(search.createdAt) >= cutoffDate
        );
      }
      
      // Sort by most recent and limit results
      const recentSearches = filteredSearches
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      
      // Format searches for agent consumption
      const formattedSearches = recentSearches.map((search: any) => {
        const formatted: any = {
          id: search.id,
          location: search.location,
          query: search.query,
          date: search.createdAt,
          timeGroup: search.groupLabel,
        };
        
        // Add details if requested
        if (includeDetails && search.results) {
          formatted.resultCount = search.results?.length || 0;
          formatted.topResults = search.results?.slice(0, 3).map((result: any) => ({
            name: result.name,
            rating: result.rating,
            address: result.vicinity || result.formatted_address,
          })) || [];
        }
        
        return formatted;
      });
      
      // Generate insights from search history
      const insights = generateSearchInsights(formattedSearches);
      
      return {
        success: true,
        searchHistory: {
          total: formattedSearches.length,
          searches: formattedSearches,
          insights,
        },
        filters: filterBy,
        summary: formattedSearches.length > 0 
          ? `Found ${formattedSearches.length} recent searches. ${insights.summary}`
          : "No recent searches found matching your criteria.",
      };
      
    } catch (error) {
      console.error('Search history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search history error',
        searchHistory: { total: 0, searches: [], insights: null },
      };
    }
  },
});

/**
 * Helper function to generate insights from search history
 */
function generateSearchInsights(searches: any[]) {
  if (searches.length === 0) {
    return { summary: "No search patterns available." };
  }
  
  // Analyze location patterns
  const locationCounts = searches.reduce((acc, search) => {
    const location = search.location;
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});
  
  const topLocation = Object.entries(locationCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  // Analyze query patterns
  const queryPatterns = searches
    .filter(search => search.query)
    .reduce((acc, search) => {
      const query = search.query.toLowerCase();
      // Extract potential brand names
      const brands = ['honda', 'toyota', 'ford', 'chevrolet', 'nissan', 'hyundai', 'kia'];
      const foundBrands = brands.filter(brand => query.includes(brand));
      foundBrands.forEach(brand => {
        acc[brand] = (acc[brand] || 0) + 1;
      });
      return acc;
    }, {});
  
  const topBrand = Object.entries(queryPatterns)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  // Generate summary
  let summary = `You've searched primarily in ${topLocation?.[0] || 'various locations'}`;
  if (topBrand) {
    summary += ` with frequent interest in ${topBrand[0]} vehicles`;
  }
  summary += '.';
  
  return {
    summary,
    patterns: {
      favoriteLocation: topLocation ? { location: topLocation[0], count: topLocation[1] } : null,
      frequentBrand: topBrand ? { brand: topBrand[0], count: topBrand[1] } : null,
      totalSearches: searches.length,
      searchFrequency: searches.length > 5 ? "Active searcher" : 
                      searches.length > 2 ? "Moderate searcher" : "New user",
    }
  };
}