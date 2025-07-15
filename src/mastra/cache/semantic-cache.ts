/**
 * @fileoverview Semantic caching with vector similarity search
 * @module mastra/cache/semantic-cache
 */

import { Index } from "@upstash/vector";
import { Redis } from "@upstash/redis";
import { getRedisClient, CacheKeys, CacheTTL } from "./redis-client";
import crypto from "crypto";

/**
 * Vector index for semantic search
 */
let vectorIndex: Index | null = null;

/**
 * Initialize vector index for semantic caching
 */
function getVectorIndex(): Index | null {
  if (vectorIndex) return vectorIndex;

  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!url || !token) {
    console.warn("⚠️ Upstash Vector not configured - semantic caching disabled");
    return null;
  }

  try {
    vectorIndex = new Index({
      url,
      token,
    });
    console.log("✅ Upstash Vector index connected");
    return vectorIndex;
  } catch (error) {
    console.error("❌ Failed to connect to Vector index:", error);
    return null;
  }
}

/**
 * Semantic cache entry
 */
interface CacheEntry {
  id: string;
  query: string;
  location: string;
  results: any;
  timestamp: number;
  hits: number;
}

/**
 * Semantic cache service for intelligent query matching
 */
export class SemanticCacheService {
  private redis: Redis | null;
  private vector: Index | null;
  private similarityThreshold: number;

  constructor() {
    this.redis = getRedisClient();
    this.vector = getVectorIndex();
    this.similarityThreshold = parseFloat(
      process.env.CACHE_SIMILARITY_THRESHOLD || "0.85"
    );
  }

  /**
   * Generate cache key from query
   */
  private generateKey(query: string, location: string): string {
    const normalized = `${query}:${location}`.toLowerCase().trim();
    return crypto.createHash("sha256").update(normalized).digest("hex").substring(0, 16);
  }

  /**
   * Check cache for similar queries
   */
  async get(query: string, location: string): Promise<any | null> {
    if (!this.redis) return null;

    try {
      // First try exact match
      const exactKey = CacheKeys.googleMapsSearch(query, location);
      const exactMatch = await this.redis.get(exactKey);
      
      if (exactMatch) {
        console.log("💾 Cache hit (exact match)");
        // Update hit counter
        await this.redis.hincrby(exactKey + ":meta", "hits", 1);
        return exactMatch;
      }

      // Try semantic search if vector index is available
      if (this.vector) {
        const queryText = `${query} ${location}`;
        const results = await this.vector.query({
          data: queryText,
          topK: 5,
          includeMetadata: true,
        });

        // Find best match above threshold
        for (const result of results) {
          if (result.score >= this.similarityThreshold) {
            const cacheKey = result.id;
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
              console.log(`💾 Cache hit (semantic match, score: ${result.score.toFixed(3)})`);
              // Update hit counter
              await this.redis.hincrby(cacheKey + ":meta", "hits", 1);
              return cached;
            }
          }
        }
      }

      console.log("🔍 Cache miss");
      return null;
    } catch (error) {
      console.error("❌ Cache get error:", error);
      return null;
    }
  }

  /**
   * Store results in cache with semantic indexing
   */
  async set(query: string, location: string, results: any): Promise<void> {
    if (!this.redis) return;

    try {
      const cacheKey = CacheKeys.googleMapsSearch(query, location);
      
      // Store in Redis with TTL
      await this.redis.setex(cacheKey, CacheTTL.SEARCH_RESULTS, JSON.stringify(results));
      
      // Store metadata
      await this.redis.hset(cacheKey + ":meta", {
        query,
        location,
        timestamp: Date.now(),
        hits: 0,
      });

      // Index in vector store if available
      if (this.vector) {
        const queryText = `${query} ${location}`;
        await this.vector.upsert({
          id: cacheKey,
          data: queryText,
          metadata: {
            query,
            location,
            resultCount: results.length,
            timestamp: Date.now(),
          },
        });
      }

      console.log("💾 Cached results");
    } catch (error) {
      console.error("❌ Cache set error:", error);
    }
  }

  /**
   * Clear cache entries older than specified days
   */
  async clearOld(daysOld: number = 30): Promise<number> {
    if (!this.redis) return 0;

    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      let cleared = 0;

      // Scan for old entries
      const keys = await this.redis.scan(0, {
        match: "gm:search:*",
        count: 100,
      });

      for (const key of keys[1]) {
        const meta = await this.redis.hget(key + ":meta", "timestamp");
        if (meta && parseInt(meta as string) < cutoffTime) {
          await this.redis.del(key);
          await this.redis.del(key + ":meta");
          cleared++;
        }
      }

      console.log(`🧹 Cleared ${cleared} old cache entries`);
      return cleared;
    } catch (error) {
      console.error("❌ Cache clear error:", error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    avgHitRate: number;
    oldestEntry: number;
  }> {
    if (!this.redis) {
      return {
        totalEntries: 0,
        totalHits: 0,
        avgHitRate: 0,
        oldestEntry: 0,
      };
    }

    try {
      const keys = await this.redis.scan(0, {
        match: "gm:search:*",
        count: 1000,
      });

      let totalEntries = 0;
      let totalHits = 0;
      let oldestEntry = Date.now();

      for (const key of keys[1]) {
        if (!key.includes(":meta")) {
          totalEntries++;
          const meta = await this.redis.hmget(key + ":meta", ["hits", "timestamp"]);
          if (meta[0]) totalHits += parseInt(meta[0] as string);
          if (meta[1]) {
            const timestamp = parseInt(meta[1] as string);
            if (timestamp < oldestEntry) oldestEntry = timestamp;
          }
        }
      }

      return {
        totalEntries,
        totalHits,
        avgHitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
        oldestEntry,
      };
    } catch (error) {
      console.error("❌ Stats error:", error);
      return {
        totalEntries: 0,
        totalHits: 0,
        avgHitRate: 0,
        oldestEntry: 0,
      };
    }
  }
}