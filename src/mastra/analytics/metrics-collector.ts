/**
 * @fileoverview AI metrics collection system
 * @module mastra/analytics/metrics-collector
 */

import { createClient } from '@supabase/supabase-js';
import { AIMetric, AnalyticsConfig } from './types';
import { getAnalyticsConfig } from './config';

/**
 * Collects and stores AI-specific metrics including token usage,
 * performance data, and interaction patterns
 */
export class AIMetricsCollector {
  private config: AnalyticsConfig;
  private supabase: any;
  private metricsBuffer: AIMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...getAnalyticsConfig(), ...config };
    
    if (this.config.enabled && this.config.storage.type === 'supabase') {
      this.initializeSupabase();
      this.startFlushTimer();
    }
  }

  private initializeSupabase() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase credentials not found, analytics disabled');
      this.config.enabled = false;
      return;
    }

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Track agent interaction metrics
   */
  async trackAgentInteraction(data: {
    agentName: string;
    duration: number;
    success: boolean;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
    sessionId?: string;
    userId?: string;
    errorType?: string;
    metadata?: Record<string, any>;
  }) {
    if (!this.config.enabled || !this.config.trackTokenUsage) return;

    const metric: AIMetric = {
      id: this.generateId(),
      type: 'agent_interaction',
      timestamp: new Date(),
      agentName: data.agentName,
      duration: data.duration,
      success: data.success,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      cost: data.cost,
      sessionId: data.sessionId,
      userId: data.userId,
      errorType: data.errorType,
      metadata: data.metadata,
    };

    this.addMetric(metric);
  }

  /**
   * Track tool usage metrics
   */
  async trackToolUsage(data: {
    toolName: string;
    duration: number;
    success: boolean;
    sessionId?: string;
    userId?: string;
    errorType?: string;
    metadata?: Record<string, any>;
  }) {
    if (!this.config.enabled) return;

    const metric: AIMetric = {
      id: this.generateId(),
      type: 'tool_usage',
      timestamp: new Date(),
      toolName: data.toolName,
      duration: data.duration,
      success: data.success,
      sessionId: data.sessionId,
      userId: data.userId,
      errorType: data.errorType,
      metadata: data.metadata,
    };

    this.addMetric(metric);
  }

  /**
   * Track workflow execution metrics
   */
  async trackWorkflowExecution(data: {
    workflowName: string;
    duration: number;
    success: boolean;
    stepsCompleted?: number;
    totalSteps?: number;
    sessionId?: string;
    userId?: string;
    errorType?: string;
    metadata?: Record<string, any>;
  }) {
    if (!this.config.enabled) return;

    const metric: AIMetric = {
      id: this.generateId(),
      type: 'workflow_execution',
      timestamp: new Date(),
      workflowName: data.workflowName,
      duration: data.duration,
      success: data.success,
      sessionId: data.sessionId,
      userId: data.userId,
      errorType: data.errorType,
      metadata: {
        ...data.metadata,
        stepsCompleted: data.stepsCompleted,
        totalSteps: data.totalSteps,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Track memory operations
   */
  async trackMemoryOperation(data: {
    operation: 'read' | 'write' | 'search' | 'update';
    duration: number;
    success: boolean;
    recordsAffected?: number;
    sessionId?: string;
    userId?: string;
    errorType?: string;
    metadata?: Record<string, any>;
  }) {
    if (!this.config.enabled) return;

    const metric: AIMetric = {
      id: this.generateId(),
      type: 'memory_operation',
      timestamp: new Date(),
      duration: data.duration,
      success: data.success,
      sessionId: data.sessionId,
      userId: data.userId,
      errorType: data.errorType,
      metadata: {
        ...data.metadata,
        operation: data.operation,
        recordsAffected: data.recordsAffected,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Add metric to buffer
   */
  private addMetric(metric: AIMetric) {
    this.metricsBuffer.push(metric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush metrics to storage
   */
  async flush() {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.storeMetrics(metricsToFlush);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Store metrics in configured storage
   */
  private async storeMetrics(metrics: AIMetric[]) {
    if (this.config.storage.type === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from(this.config.storage.tableName || 'ai_analytics')
        .insert(metrics.map(this.formatMetricForStorage));

      if (error) {
        throw new Error(`Supabase insert failed: ${error.message}`);
      }
    }
    // Add other storage types as needed
  }

  /**
   * Format metric for storage
   */
  private formatMetricForStorage(metric: AIMetric) {
    return {
      id: metric.id,
      type: metric.type,
      timestamp: metric.timestamp.toISOString(),
      agent_name: metric.agentName,
      tool_name: metric.toolName,
      workflow_name: metric.workflowName,
      duration_ms: metric.duration,
      success: metric.success,
      input_tokens: metric.inputTokens,
      output_tokens: metric.outputTokens,
      cost_usd: metric.cost,
      session_id: metric.sessionId,
      user_id: metric.userId,
      error_type: metric.errorType,
      metadata: metric.metadata,
    };
  }

  /**
   * Generate unique metric ID
   */
  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get metrics summary for a time period
   */
  async getMetricsSummary(startDate: Date, endDate: Date) {
    if (!this.config.enabled || !this.supabase) {
      throw new Error('Analytics not enabled or configured');
    }

    const { data, error } = await this.supabase
      .from(this.config.storage.tableName || 'ai_analytics')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }

    return this.aggregateMetrics(data);
  }

  /**
   * Aggregate raw metrics into summary
   */
  private aggregateMetrics(metrics: any[]) {
    const summary = {
      totalInteractions: metrics.length,
      successRate: metrics.filter(m => m.success).length / metrics.length,
      averageDuration: metrics.reduce((sum, m) => sum + m.duration_ms, 0) / metrics.length,
      totalTokens: metrics.reduce((sum, m) => sum + (m.input_tokens || 0) + (m.output_tokens || 0), 0),
      totalCost: metrics.reduce((sum, m) => sum + (m.cost_usd || 0), 0),
      
      byType: metrics.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      }, {}),
      
      byAgent: metrics.reduce((acc, m) => {
        if (m.agent_name) {
          acc[m.agent_name] = (acc[m.agent_name] || 0) + 1;
        }
        return acc;
      }, {}),
      
      errors: metrics
        .filter(m => !m.success)
        .reduce((acc, m) => {
          acc[m.error_type || 'unknown'] = (acc[m.error_type || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
    };

    return summary;
  }

  /**
   * Cleanup old metrics
   */
  async cleanup() {
    if (!this.config.enabled || !this.supabase) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const { error } = await this.supabase
      .from(this.config.storage.tableName || 'ai_analytics')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flush();
  }
}