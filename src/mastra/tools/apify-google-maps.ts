/**
 * @fileoverview Google Maps scraper using direct Apify API
 * @module mastra/tools/apify-google-maps
 */

import { z } from "zod";

/**
 * Input schema for Google Maps scraper
 */
export const GoogleMapsInputSchema = z.object({
  query: z.string().describe("Search query for Google Maps"),
  location: z.string().describe("Location to search in"),
  maxResults: z.number().default(50).describe("Maximum number of results"),
  minRating: z.number().default(4.0).describe("Minimum rating filter"),
  language: z.string().default("es").describe("Language for results"),
});

/**
 * Agency schema matching our requirements
 */
export const ScrapedAgencySchema = z.object({
  placeId: z.string(),
  title: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  totalScore: z.number(),
  reviewsCount: z.number(),
  categoryName: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  openingHours: z.array(z.object({
    day: z.string(),
    hours: z.string(),
  })).optional(),
  permanentlyClosed: z.boolean(),
  temporarilyClosed: z.boolean(),
  imageCategories: z.array(z.string()).optional(),
  categories: z.array(z.string()),
});

/**
 * Run Google Maps scraper via Apify API
 */
export async function scrapeGoogleMaps(input: z.infer<typeof GoogleMapsInputSchema>) {
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
  
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const actorId = "compass/google-maps-extractor";
  
  // Start the actor run
  const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${APIFY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchStringsArray: [input.query],
      locationQuery: input.location,
      maxCrawledPlacesPerSearch: input.maxResults,
      language: input.language,
      skipClosedPlaces: true,
      placeMinimumStars: input.minRating >= 4.5 ? "fourAndHalf" : 
                         input.minRating >= 4.0 ? "four" : 
                         input.minRating >= 3.5 ? "threeAndHalf" : "",
    }),
  });

  if (!runResponse.ok) {
    const error = await runResponse.text();
    throw new Error(`Failed to start Apify actor: ${error}`);
  }

  const run = await runResponse.json();
  const runId = run.data.id;
  
  console.log(`🚀 Apify run started: ${runId}`);
  
  // Wait for the run to complete
  let status = "RUNNING";
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (status === "RUNNING" && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
        },
      }
    );
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      console.log(`⏳ Status: ${status}`);
    }
    
    attempts++;
  }
  
  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run failed with status: ${status}`);
  }
  
  // Get the results
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
    }
  );
  
  if (!resultsResponse.ok) {
    throw new Error("Failed to fetch results");
  }
  
  const results = await resultsResponse.json();
  
  // Transform results to our schema
  const agencies = results.map((place: any) => ({
    placeId: place.placeId,
    title: place.title,
    address: place.address,
    phone: place.phone,
    website: place.website,
    totalScore: place.totalScore || 0,
    reviewsCount: place.reviewsCount || 0,
    categoryName: place.categoryName,
    location: place.location,
    openingHours: place.openingHours,
    permanentlyClosed: place.permanentlyClosed || false,
    temporarilyClosed: place.temporarilyClosed || false,
    imageCategories: place.imageCategories,
    categories: place.categories || [],
  }));
  
  // Calculate cost
  const cost = (agencies.length / 1000) * 3; // $3 per 1000 results
  
  return {
    success: true,
    agencies,
    totalFound: agencies.length,
    runId,
    cost,
  };
}