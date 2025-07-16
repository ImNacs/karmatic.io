/**
 * @fileoverview Redis client configuration for caching
 * @module mastra/cache/redis-client
 */

import { Redis } from "@upstash/redis";

// Initialize Redis client
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("⚠️ Upstash Redis not configured - caching disabled");
    console.warn("💡 Get your credentials at: https://console.upstash.com");
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    
    console.log("✅ Upstash Redis connected");
    return redisClient;
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    return null;
  }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // Google Places search results
  placesSearch: (query: string, lat: number, lng: number) => 
    `places:${query}:${lat}:${lng}`.toLowerCase().replace(/\s+/g, "-"),
  
  // Agency reviews from Apify
  agencyReviews: (placeId: string) => 
    `reviews:${placeId}`,
  
  // Trust analysis results
  trustAnalysis: (placeId: string) => 
    `trust:${placeId}`,
  
  // Perplexity analysis results
  perplexityAnalysis: (placeId: string) => 
    `perplexity:${placeId}`,
};

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  PLACES_SEARCH: 3600,        // 1 hour - places data changes slowly
  AGENCY_REVIEWS: 86400,      // 24 hours - reviews update daily
  TRUST_ANALYSIS: 86400,      // 24 hours - trust scores are stable
  PERPLEXITY_ANALYSIS: 86400 * 7, // 7 days - deep analysis is expensive
};