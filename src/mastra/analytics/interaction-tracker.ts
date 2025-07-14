/**
 * @fileoverview User interaction tracking for analytics
 * @module mastra/analytics/interaction-tracker
 */

import { createClient } from '@supabase/supabase-js';
import { InteractionMetric, AnalyticsConfig } from './types';
import { getAnalyticsConfig } from './config';

/**
 * Tracks and analyzes user interactions with the AI system
 */
export class UserInteractionTracker {
  private config: AnalyticsConfig;
  private supabase: any;
  private interactionBuffer: InteractionMetric[] = [];
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
      console.warn('Supabase credentials not found, interaction tracking disabled');
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
   * Track conversation start
   */
  trackConversationStart(sessionId: string, userId?: string, location?: string) {
    if (!this.config.enabled || !this.config.trackUserInteractions) return;

    const metric: InteractionMetric = {
      id: this.generateId(),
      type: 'conversation_start',
      timestamp: new Date(),
      action: 'start_conversation',
      context: { location },
      outcome: 'success',
      sessionId,
      userId,
    };

    this.addMetric(metric);
  }

  /**
   * Track message sent by user
   */
  trackMessageSent(
    message: string,
    sessionId: string,
    userId?: string,
    searchType?: string,
    features?: string[]
  ) {
    if (!this.config.enabled || !this.config.trackUserInteractions) return;

    const metric: InteractionMetric = {
      id: this.generateId(),
      type: 'message_sent',
      timestamp: new Date(),
      action: 'send_message',
      context: { searchType, features },
      outcome: 'success',
      sessionId,
      userId,
      metadata: {
        messageLength: message.length,
        hasAttachments: false,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Track tool usage
   */
  trackToolCall(
    toolName: string,
    outcome: 'success' | 'failure' | 'partial',
    sessionId: string,
    userId?: string,
    duration?: number,
    errorMessage?: string
  ) {
    if (!this.config.enabled || !this.config.trackUserInteractions) return;

    const metric: InteractionMetric = {
      id: this.generateId(),
      type: 'tool_called',
      timestamp: new Date(),
      action: `tool_${toolName}`,
      context: {},
      outcome,
      sessionId,
      userId,
      metadata: {
        toolName,
        duration,
        errorMessage,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Track user satisfaction rating
   */
  trackSatisfactionRating(
    rating: number,
    comment: string | undefined,
    sessionId: string,
    userId?: string
  ) {
    if (!this.config.enabled || !this.config.trackUserInteractions) return;

    const metric: InteractionMetric = {
      id: this.generateId(),
      type: 'satisfaction_rating',
      timestamp: new Date(),
      action: 'rate_interaction',
      context: {},
      outcome: 'success',
      sessionId,
      userId,
      userFeedback: {
        rating,
        comment,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Add metric to buffer
   */
  private addMetric(metric: InteractionMetric) {
    this.interactionBuffer.push(metric);

    if (this.interactionBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush metrics to storage
   */
  async flush() {
    if (this.interactionBuffer.length === 0) return;

    const metricsToFlush = [...this.interactionBuffer];
    this.interactionBuffer = [];

    try {
      await this.storeMetrics(metricsToFlush);
    } catch (error) {
      console.error('Failed to flush interaction metrics:', error);
      // Re-add metrics to buffer for retry
      this.interactionBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Store metrics to configured storage
   */
  private async storeMetrics(metrics: InteractionMetric[]) {
    if (this.config.storage.type === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from(this.config.storage.tableName || 'ai_analytics')
        .insert(
          metrics.map(metric => ({
            ...metric,
            metric_type: 'interaction',
            timestamp: metric.timestamp.toISOString(),
          }))
        );

      if (error) {
        throw new Error(`Supabase storage error: ${error.message}`);
      }
    } else if (this.config.storage.type === 'memory') {
      // Store in memory for testing
      console.log('Interaction metrics (memory storage):', metrics);
    }
  }

  /**
   * Generate unique ID for metrics
   */
  private generateId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get interaction summary for a time period
   */
  async getInteractionSummary(startDate: Date, endDate: Date, userId?: string) {
    if (!this.supabase) return null;

    let query = this.supabase
      .from(this.config.storage.tableName || 'ai_analytics')
      .select('*')
      .eq('metric_type', 'interaction')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get interaction summary:', error);
      return null;
    }

    return this.aggregateInteractionData(data || []);
  }

  /**
   * Aggregate interaction data for reporting
   */
  private aggregateInteractionData(metrics: any[]) {
    const totalSessions = new Set(metrics.map(m => m.sessionId)).size;
    const totalMessages = metrics.filter(m => m.type === 'message_sent').length;
    const toolUsage = metrics.filter(m => m.type === 'tool_called');
    const ratings = metrics.filter(m => m.type === 'satisfaction_rating');

    return {
      totalSessions,
      totalMessages,
      toolUsage: {
        total: toolUsage.length,
        successRate: toolUsage.filter(t => t.outcome === 'success').length / Math.max(toolUsage.length, 1),
        mostUsed: this.getMostUsedTools(toolUsage),
      },
      satisfaction: {
        averageRating: ratings.reduce((sum, r) => sum + (r.userFeedback?.rating || 0), 0) / Math.max(ratings.length, 1),
        totalRatings: ratings.length,
      },
    };
  }

  /**
   * Get most used tools from metrics
   */
  private getMostUsedTools(toolMetrics: any[]) {
    const toolCounts = toolMetrics.reduce((acc, metric) => {
      const toolName = metric.metadata?.toolName || 'unknown';
      acc[toolName] = (acc[toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(toolCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush any remaining metrics
    this.flush();
  }
}