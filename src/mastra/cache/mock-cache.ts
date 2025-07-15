/**
 * @fileoverview Mock cache for testing without external dependencies
 * @module mastra/cache/mock-cache
 */

import crypto from "crypto";

/**
 * In-memory cache for testing
 */
export class MockCacheService {
  private cache: Map<string, any> = new Map();
  private metadata: Map<string, any> = new Map();

  /**
   * Generate cache key
   */
  private generateKey(query: string, location: string): string {
    return `${query}:${location}`.toLowerCase().trim();
  }

  /**
   * Get from cache
   */
  async get(query: string, location: string): Promise<any | null> {
    const key = this.generateKey(query, location);
    
    // Check exact match
    if (this.cache.has(key)) {
      console.log("💾 Mock cache hit (exact match)");
      const meta = this.metadata.get(key) || { hits: 0 };
      meta.hits++;
      this.metadata.set(key, meta);
      return this.cache.get(key);
    }

    // Simple semantic matching (for testing)
    const queryWords = query.toLowerCase().split(/\s+/);
    const locationWords = location.toLowerCase().split(/\s+/);

    for (const [cacheKey, value] of this.cache.entries()) {
      const [cachedQuery, cachedLocation] = cacheKey.split(":");
      const cachedQueryWords = cachedQuery.split(/\s+/);
      const cachedLocationWords = cachedLocation.split(/\s+/);

      // Check word overlap
      const queryOverlap = queryWords.some(w => 
        cachedQueryWords.some(cw => cw.includes(w) || w.includes(cw))
      );
      const locationOverlap = locationWords.some(w => 
        cachedLocationWords.some(cw => cw.includes(w) || w.includes(cw))
      );

      if (queryOverlap && locationOverlap) {
        console.log(`💾 Mock cache hit (semantic match: ${cacheKey})`);
        const meta = this.metadata.get(cacheKey) || { hits: 0 };
        meta.hits++;
        this.metadata.set(cacheKey, meta);
        return value;
      }
    }

    console.log("🔍 Mock cache miss");
    return null;
  }

  /**
   * Store in cache
   */
  async set(query: string, location: string, results: any): Promise<void> {
    const key = this.generateKey(query, location);
    this.cache.set(key, results);
    this.metadata.set(key, {
      query,
      location,
      timestamp: Date.now(),
      hits: 0,
    });
    console.log(`💾 Mock cached: ${key}`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    avgHitRate: number;
  }> {
    let totalHits = 0;
    
    for (const meta of this.metadata.values()) {
      totalHits += meta.hits || 0;
    }

    const totalEntries = this.cache.size;

    return {
      totalEntries,
      totalHits,
      avgHitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.metadata.clear();
    console.log("🧹 Mock cache cleared");
  }
}