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
  // Google Maps search results
  googleMapsSearch: (query: string, location: string) => 
    `gm:search:${query}:${location}`.toLowerCase().replace(/\s+/g, "-"),
  
  // Agency analysis results
  agencyAnalysis: (placeId: string) => 
    `agency:analysis:${placeId}`,
  
  // Filter results
  filterResults: (configHash: string) => 
    `filter:results:${configHash}`,
  
  // Semantic search embeddings
  semanticSearch: (queryHash: string) => 
    `semantic:${queryHash}`,
};

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  SEARCH_RESULTS: parseInt(process.env.SEMANTIC_CACHE_TTL || "604800"), // 7 days
  ANALYSIS_RESULTS: 86400 * 30, // 30 days
  FILTER_RESULTS: 3600, // 1 hour
};