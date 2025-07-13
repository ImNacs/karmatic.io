/**
 * @fileoverview Analytics and metrics system for Mastra AI
 * @module mastra/analytics
 * 
 * This module provides comprehensive analytics for AI agent performance,
 * user interactions, and system metrics.
 */

export { AIMetricsCollector } from "./metrics-collector";
export { AgentPerformanceAnalyzer } from "./performance-analyzer";
export { UserInteractionTracker } from "./interaction-tracker";
export { SystemHealthMonitor } from "./health-monitor";

// Analytics configuration
export { analyticsConfig } from "./config";

// Types
export type {
  AIMetric,
  PerformanceMetric,
  InteractionMetric,
  HealthMetric,
  AnalyticsConfig
} from "./types";