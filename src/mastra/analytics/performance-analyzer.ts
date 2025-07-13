/**
 * @fileoverview Performance analysis for AI agents
 * @module mastra/analytics/performance-analyzer
 */

import { PerformanceMetric, AnalyticsConfig } from './types';
import { getAnalyticsConfig } from './config';

/**
 * Analyzes and tracks performance metrics for AI system components
 */
export class AgentPerformanceAnalyzer {
  private config: AnalyticsConfig;
  private performanceBuffer: PerformanceMetric[] = [];

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...getAnalyticsConfig(), ...config };
  }

  /**
   * Track response time performance
   */
  trackResponseTime(agentName: string, duration: number, sessionId?: string) {
    if (!this.config.enabled || !this.config.trackPerformance) return;

    const metric: PerformanceMetric = {
      id: this.generateId(),
      type: 'response_time',
      timestamp: new Date(),
      value: duration,
      unit: 'ms',
      target: this.config.performanceThresholds.responseTimeMs,
      threshold: this.config.performanceThresholds.responseTimeMs * 1.2,
      sessionId,
      metadata: { agentName },
    };

    this.addMetric(metric);

    // Alert if threshold exceeded
    if (duration > this.config.performanceThresholds.responseTimeMs) {
      this.handlePerformanceAlert('response_time', agentName, duration);
    }
  }

  /**
   * Track system throughput
   */
  trackThroughput(requestsPerSecond: number, sessionId?: string) {
    if (!this.config.enabled || !this.config.trackPerformance) return;

    const metric: PerformanceMetric = {
      id: this.generateId(),
      type: 'throughput',
      timestamp: new Date(),
      value: requestsPerSecond,
      unit: 'rps',
      sessionId,
    };

    this.addMetric(metric);
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(usageMB: number, component?: string) {
    if (!this.config.enabled || !this.config.trackPerformance) return;

    const metric: PerformanceMetric = {
      id: this.generateId(),
      type: 'memory_usage',
      timestamp: new Date(),
      value: usageMB,
      unit: 'MB',
      target: this.config.performanceThresholds.memoryUsageMB,
      threshold: this.config.performanceThresholds.memoryUsageMB * 1.5,
      metadata: { component },
    };

    this.addMetric(metric);

    if (usageMB > this.config.performanceThresholds.memoryUsageMB) {
      this.handlePerformanceAlert('memory_usage', component || 'system', usageMB);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMs: number = 300000) { // 5 minutes default
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMs);

    const recentMetrics = this.performanceBuffer.filter(
      m => m.timestamp >= windowStart
    );

    const summary = {
      responseTime: this.analyzeMetricsByType(recentMetrics, 'response_time'),
      throughput: this.analyzeMetricsByType(recentMetrics, 'throughput'),
      memoryUsage: this.analyzeMetricsByType(recentMetrics, 'memory_usage'),
      alerts: this.getRecentAlerts(timeWindowMs),
    };

    return summary;
  }

  private analyzeMetricsByType(metrics: PerformanceMetric[], type: string) {
    const typeMetrics = metrics.filter(m => m.type === type);
    
    if (typeMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, unit: '' };
    }

    const values = typeMetrics.map(m => m.value);
    return {
      count: typeMetrics.length,
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      unit: typeMetrics[0].unit,
      thresholdExceeded: typeMetrics.filter(m => 
        m.threshold && m.value > m.threshold
      ).length,
    };
  }

  private addMetric(metric: PerformanceMetric) {
    this.performanceBuffer.push(metric);

    // Keep buffer size manageable
    const maxBufferSize = 1000;
    if (this.performanceBuffer.length > maxBufferSize) {
      this.performanceBuffer = this.performanceBuffer.slice(-maxBufferSize / 2);
    }
  }

  private handlePerformanceAlert(type: string, component: string, value: number) {
    console.warn(`Performance alert: ${type} for ${component} exceeded threshold: ${value}`);
    
    // In production, this could integrate with alerting systems
    // like PagerDuty, Slack, or email notifications
  }

  private getRecentAlerts(timeWindowMs: number) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMs);

    return this.performanceBuffer
      .filter(m => 
        m.timestamp >= windowStart && 
        m.threshold && 
        m.value > m.threshold
      )
      .map(m => ({
        type: m.type,
        component: m.metadata?.component || m.metadata?.agentName || 'unknown',
        value: m.value,
        threshold: m.threshold,
        timestamp: m.timestamp,
      }));
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}