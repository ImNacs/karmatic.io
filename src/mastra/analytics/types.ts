/**
 * @fileoverview Type definitions for analytics system
 * @module mastra/analytics/types
 */

/**
 * Base metric interface
 */
export interface BaseMetric {
  id: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * AI-specific metrics
 */
export interface AIMetric extends BaseMetric {
  type: 'agent_interaction' | 'tool_usage' | 'workflow_execution' | 'memory_operation';
  agentName?: string;
  toolName?: string;
  workflowName?: string;
  duration: number;
  success: boolean;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  errorType?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetric extends BaseMetric {
  type: 'response_time' | 'throughput' | 'memory_usage' | 'cpu_usage';
  value: number;
  unit: string;
  target?: number;
  threshold?: number;
}

/**
 * User interaction metrics
 */
export interface InteractionMetric extends BaseMetric {
  type: 'conversation_start' | 'message_sent' | 'tool_called' | 'satisfaction_rating';
  action: string;
  context: {
    location?: string;
    searchType?: string;
    features?: string[];
  };
  outcome: 'success' | 'failure' | 'partial' | 'unknown';
  userFeedback?: {
    rating?: number;
    comment?: string;
  };
}

/**
 * System health metrics
 */
export interface HealthMetric extends BaseMetric {
  type: 'api_availability' | 'database_health' | 'memory_store_health' | 'tool_availability';
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  errorRate?: number;
  details?: Record<string, any>;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number; // ms
  retentionDays: number;
  
  // Feature flags
  trackTokenUsage: boolean;
  trackPerformance: boolean;
  trackUserInteractions: boolean;
  trackSystemHealth: boolean;
  
  // Thresholds
  performanceThresholds: {
    responseTimeMs: number;
    errorRatePercent: number;
    memoryUsageMB: number;
  };
  
  // Storage configuration
  storage: {
    type: 'supabase' | 'postgres' | 'memory';
    connectionString?: string;
    tableName?: string;
  };
}

/**
 * Aggregated analytics data
 */
export interface AnalyticsSummary {
  period: {
    start: Date;
    end: Date;
  };
  
  usage: {
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    averageSessionDuration: number;
  };
  
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    topErrors: Array<{ type: string; count: number }>;
  };
  
  features: {
    mostUsedTools: Array<{ name: string; count: number }>;
    mostUsedWorkflows: Array<{ name: string; count: number }>;
    popularSearchLocations: Array<{ location: string; count: number }>;
  };
  
  trends: {
    dailyUsage: Array<{ date: string; sessions: number; messages: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  };
}