/**
 * @fileoverview Google Maps scraper tool using Apify
 * @module mastra/tools/google-maps-scraper
 */

import { createTool } from "@mastra/core";
import { z } from "zod";
import { apifyMcpServer } from "../mcpServers/apify";

/**
 * Input schema for Google Maps scraper
 */
const GoogleMapsScraperInput = z.object({
  query: z.string().describe("Search query for Google Maps (e.g., 'car dealers in Mexico City')"),
  maxResults: z.number().default(50).describe("Maximum number of results to return"),
  locationFilter: z.object({
    lat: z.number().describe("Latitude for location-based search"),
    lng: z.number().describe("Longitude for location-based search"),
    radius: z.number().default(10000).describe("Search radius in meters"),
  }).optional(),
  businessTypes: z.array(z.string()).default(["car dealer", "auto sales"]).describe("Business types to filter"),
  minRating: z.number().default(4.0).describe("Minimum rating filter"),
  includeReviews: z.boolean().default(true).describe("Include recent reviews in results"),
});

/**
 * Output schema for scraped businesses
 */
const ScrapedBusiness = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  rating: z.number(),
  reviewCount: z.number(),
  businessType: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  hours: z.record(z.string()).optional(),
  recentReviews: z.array(z.object({
    author: z.string(),
    rating: z.number(),
    text: z.string(),
    date: z.string(),
  })).optional(),
  images: z.array(z.string()).optional(),
});

/**
 * Google Maps scraper tool for extracting business data
 */
export const googleMapsScraperTool = createTool({
  id: "google-maps-scraper",
  name: "Google Maps Business Scraper",
  description: "Scrapes business information from Google Maps using Apify",
  inputSchema: GoogleMapsScraperInput,
  outputSchema: z.object({
    success: z.boolean(),
    businesses: z.array(ScrapedBusiness),
    totalFound: z.number(),
    executionTime: z.number(),
    cost: z.number().describe("Estimated cost in USD"),
  }),
  execute: async ({ input }) => {
    try {
      // Check if Apify is available
      if (!apifyMcpServer) {
        throw new Error("Apify MCP server not configured. Please set APIFY_API_TOKEN.");
      }

      // Construct the search parameters
      const searchParams = {
        queries: [input.query],
        maxCrawledPlacesPerSearch: input.maxResults,
        language: "es",
        reviewsSort: "newest",
        maxReviews: input.includeReviews ? 5 : 0,
        scrapeDirectories: false,
        // Location-based filtering if provided
        ...(input.locationFilter && {
          lat: input.locationFilter.lat,
          lng: input.locationFilter.lng,
          zoom: 14, // City-level zoom
        }),
      };

      console.log(`🔍 Scraping Google Maps for: ${input.query}`);
      const startTime = Date.now();

      // Call Apify actor via MCP
      const result = await apifyMcpServer.callTool({
        name: "compass/google-maps-extractor",
        arguments: searchParams,
      });

      if (!result || !result.data) {
        throw new Error("No data returned from Apify");
      }

      // Filter and transform results
      const businesses = result.data
        .filter((place: any) => {
          // Apply rating filter
          if (place.rating < input.minRating) return false;
          
          // Apply business type filter
          const placeType = place.category || place.categoryName || "";
          return input.businessTypes.some(type => 
            placeType.toLowerCase().includes(type.toLowerCase())
          );
        })
        .map((place: any) => ({
          placeId: place.placeId || place.url?.split("/place/")[1]?.split("/")[0] || "",
          name: place.title || place.name,
          address: place.address || place.streetAddress,
          phone: place.phone,
          website: place.website,
          rating: place.rating || 0,
          reviewCount: place.reviewsCount || 0,
          businessType: place.category || place.categoryName || "Unknown",
          location: {
            lat: place.location?.lat || 0,
            lng: place.location?.lng || 0,
          },
          hours: place.openingHours,
          recentReviews: place.reviews?.map((review: any) => ({
            author: review.name,
            rating: review.rating,
            text: review.text,
            date: review.publishedAtDate,
          })),
          images: place.imageUrls?.slice(0, 5), // Limit to 5 images
        }));

      const executionTime = (Date.now() - startTime) / 1000;
      const estimatedCost = (businesses.length / 1000) * 3.5; // ~$3.50 per 1000 results

      console.log(`✅ Scraped ${businesses.length} businesses in ${executionTime}s`);
      console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);

      return {
        success: true,
        businesses,
        totalFound: businesses.length,
        executionTime,
        cost: estimatedCost,
      };
    } catch (error) {
      console.error("❌ Google Maps scraper error:", error);
      return {
        success: false,
        businesses: [],
        totalFound: 0,
        executionTime: 0,
        cost: 0,
      };
    }
  },
});

/**
 * Helper function to calculate average reviews per month
 */
export function calculateReviewsPerMonth(
  reviewCount: number,
  oldestReviewDate?: string,
  monthsToAnalyze: number = 6
): number {
  if (!oldestReviewDate || reviewCount === 0) return 0;
  
  const reviewDate = new Date(oldestReviewDate);
  const now = new Date();
  const monthsDiff = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  // Use the smaller of actual months or analysis period
  const effectiveMonths = Math.min(monthsDiff, monthsToAnalyze);
  
  return reviewCount / Math.max(effectiveMonths, 1);
}