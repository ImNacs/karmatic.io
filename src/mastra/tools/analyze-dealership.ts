/**
 * @fileoverview Tool for analyzing individual dealership details
 * @module mastra/tools/analyze-dealership
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for dealership analysis parameters
 */
const analyzeDealershipSchema = z.object({
  placeId: z.string().describe("Google Places ID of the dealership to analyze"),
  includeReviews: z.boolean().default(false).describe("Whether to include recent reviews in the analysis"),
  includeHours: z.boolean().default(true).describe("Whether to include operating hours"),
  includeContact: z.boolean().default(true).describe("Whether to include contact information"),
});

/**
 * Tool for getting detailed information about a specific dealership
 * 
 * This tool provides comprehensive analysis of a dealership including
 * ratings, reviews, services, and operational details.
 */
export const analyzeDealership = createTool({
  id: "analyze-dealership",
  description: "Get detailed analysis and information about a specific dealership",
  inputSchema: analyzeDealershipSchema,
  
  execute: async ({ placeId, includeReviews, includeHours, includeContact }) => {
    try {
      // Call Google Places API for detailed information
      const detailsParams = new URLSearchParams({
        place_id: placeId,
        key: process.env.GOOGLE_PLACES_API_KEY || '',
        fields: [
          'name',
          'rating',
          'user_ratings_total',
          'formatted_address',
          'formatted_phone_number',
          'website',
          'types',
          'price_level',
          'opening_hours',
          includeReviews ? 'reviews' : '',
        ].filter(Boolean).join(','),
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${detailsParams}`
      );
      
      if (!response.ok) {
        throw new Error(`Places API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.result) {
        throw new Error(`Places API returned: ${data.status}`);
      }

      const place = data.result;
      
      // Analyze the dealership data
      const analysis = {
        basic: {
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          priceLevel: place.price_level,
          types: place.types,
        },
        
        // Service analysis
        services: {
          isCarDealer: place.types?.includes('car_dealer') || false,
          isCarRepair: place.types?.includes('car_repair') || false,
          hasCarWash: place.types?.includes('car_wash') || false,
          serviceTypes: place.types?.filter((type: string) => 
            type.includes('car_') || type.includes('automotive')
          ) || [],
        },
        
        // Rating analysis
        ratingAnalysis: {
          score: place.rating,
          level: place.rating >= 4.5 ? 'Excellent' : 
                 place.rating >= 4.0 ? 'Very Good' : 
                 place.rating >= 3.5 ? 'Good' : 
                 place.rating >= 3.0 ? 'Average' : 'Below Average',
          reliability: place.user_ratings_total >= 100 ? 'High' : 
                      place.user_ratings_total >= 50 ? 'Medium' : 'Low',
          totalReviews: place.user_ratings_total,
        },
      };
      
      // Add contact information if requested
      if (includeContact) {
        analysis.contact = {
          phone: place.formatted_phone_number,
          website: place.website,
        };
      }
      
      // Add operating hours if requested
      if (includeHours && place.opening_hours) {
        analysis.hours = {
          openNow: place.opening_hours.open_now,
          weekdayText: place.opening_hours.weekday_text,
        };
      }
      
      // Add recent reviews if requested
      if (includeReviews && place.reviews) {
        analysis.recentReviews = place.reviews.slice(0, 5).map((review: any) => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text?.substring(0, 200) + (review.text?.length > 200 ? '...' : ''),
          time: review.relative_time_description,
        }));
      }
      
      return {
        success: true,
        placeId,
        analysis,
        summary: `${place.name} - ${analysis.ratingAnalysis.level} rated dealership (${place.rating}/5 with ${place.user_ratings_total} reviews)`,
      };
      
    } catch (error) {
      console.error('Dealership analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown analysis error',
        placeId,
      };
    }
  },
});