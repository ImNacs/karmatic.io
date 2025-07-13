/**
 * @fileoverview Analytics configuration
 * @module mastra/analytics/config
 */

import { AnalyticsConfig } from "./types";

/**
 * Default analytics configuration
 */
export const analyticsConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_ANALYTICS === 'true',
  batchSize: 100,
  flushInterval: 30000, // 30 seconds
  retentionDays: 90,
  
  // Feature flags
  trackTokenUsage: true,
  trackPerformance: true,
  trackUserInteractions: true,
  trackSystemHealth: true,
  
  // Performance thresholds
  performanceThresholds: {
    responseTimeMs: 5000, // 5 seconds
    errorRatePercent: 5, // 5%
    memoryUsageMB: 512, // 512 MB
  },
  
  // Storage configuration
  storage: {
    type: 'supabase',
    connectionString: process.env.DATABASE_URL,
    tableName: 'ai_analytics',
  },
};

/**
 * Environment-specific configurations
 */
export const environmentConfigs = {
  development: {
    ...analyticsConfig,
    enabled: false,
    batchSize: 10,
    flushInterval: 5000,
    trackTokenUsage: false,
  },
  
  test: {
    ...analyticsConfig,
    enabled: false,
    storage: {
      type: 'memory' as const,
    },
  },
  
  production: {
    ...analyticsConfig,
    enabled: true,
    batchSize: 1000,
    flushInterval: 60000, // 1 minute
  },
} as const;

/**
 * Get configuration for current environment
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const env = process.env.NODE_ENV as keyof typeof environmentConfigs;
  return environmentConfigs[env] || analyticsConfig;
}