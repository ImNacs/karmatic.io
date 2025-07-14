/**
 * @fileoverview System health monitoring for analytics
 * @module mastra/analytics/health-monitor
 */

import { createClient } from '@supabase/supabase-js';
import { HealthMetric, AnalyticsConfig } from './types';
import { getAnalyticsConfig } from './config';

/**
 * Monitors and tracks system health metrics
 */
export class SystemHealthMonitor {
  private config: AnalyticsConfig;
  private supabase: any;
  private healthBuffer: HealthMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...getAnalyticsConfig(), ...config };
    
    if (this.config.enabled && this.config.storage.type === 'supabase') {
      this.initializeSupabase();
      this.startFlushTimer();
    }

    if (this.config.enabled && this.config.trackSystemHealth) {
      this.startHealthMonitoring();
    }
  }

  private initializeSupabase() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase credentials not found, health monitoring disabled');
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

  private startHealthMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    // Monitor health every 5 minutes
    this.monitoringTimer = setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000);

    // Initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks() {
    await Promise.all([
      this.checkDatabaseHealth(),
      this.checkApiAvailability(),
      this.checkMemoryStoreHealth(),
      this.checkToolAvailability(),
    ]);
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    if (!this.config.enabled || !this.config.trackSystemHealth) return;

    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let details: Record<string, any> = {};

    try {
      if (this.supabase) {
        // Simple query to test database connectivity
        const { data, error } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);

        const responseTime = Date.now() - startTime;

        if (error) {
          status = 'unhealthy';
          details = { error: error.message };
        } else if (responseTime > 5000) {
          status = 'degraded';
          details = { slowResponse: true };
        }

        this.recordHealthMetric('database_health', 'supabase', status, responseTime, details);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordHealthMetric(
        'database_health',
        'supabase',
        'unhealthy',
        responseTime,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check API availability
   */
  async checkApiAvailability() {
    if (!this.config.enabled || !this.config.trackSystemHealth) return;

    const apis = [
      { name: 'places_api', url: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_URL },
      { name: 'internal_api', url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/health` },
    ];

    for (const api of apis) {
      if (!api.url) continue;

      const startTime = Date.now();
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let details: Record<string, any> = {};

      try {
        const response = await fetch(api.url, {
          method: 'HEAD',
          timeout: 10000,
        } as any);

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          status = 'unhealthy';
          details = { httpStatus: response.status };
        } else if (responseTime > 3000) {
          status = 'degraded';
          details = { slowResponse: true };
        }

        this.recordHealthMetric('api_availability', api.name, status, responseTime, details);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.recordHealthMetric(
          'api_availability',
          api.name,
          'unhealthy',
          responseTime,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
  }

  /**
   * Check memory store health
   */
  async checkMemoryStoreHealth() {
    if (!this.config.enabled || !this.config.trackSystemHealth) return;

    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let details: Record<string, any> = {};

    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

      if (memoryUsageMB > this.config.performanceThresholds.memoryUsageMB * 1.5) {
        status = 'unhealthy';
        details = { highMemoryUsage: true, memoryUsageMB };
      } else if (memoryUsageMB > this.config.performanceThresholds.memoryUsageMB) {
        status = 'degraded';
        details = { elevatedMemoryUsage: true, memoryUsageMB };
      }

      const responseTime = Date.now() - startTime;
      details = { ...details, memoryUsage };

      this.recordHealthMetric('memory_store_health', 'nodejs', status, responseTime, details);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordHealthMetric(
        'memory_store_health',
        'nodejs',
        'unhealthy',
        responseTime,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check tool availability
   */
  async checkToolAvailability() {
    if (!this.config.enabled || !this.config.trackSystemHealth) return;

    const tools = [
      'search-dealerships',
      'analyze-dealership',
      'get-vehicle-inventory',
      'get-market-insights',
      'compare-vehicles',
    ];

    for (const toolName of tools) {
      const startTime = Date.now();
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let details: Record<string, any> = {};

      try {
        // Simple tool availability check
        // In a real implementation, you might try to load the tool or check its dependencies
        const responseTime = Date.now() - startTime;

        // For now, assume tools are healthy if no errors occur
        this.recordHealthMetric('tool_availability', toolName, status, responseTime, details);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.recordHealthMetric(
          'tool_availability',
          toolName,
          'unhealthy',
          responseTime,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
  }

  /**
   * Record a health metric
   */
  private recordHealthMetric(
    type: 'api_availability' | 'database_health' | 'memory_store_health' | 'tool_availability',
    service: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTime?: number,
    details?: Record<string, any>
  ) {
    const metric: HealthMetric = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      service,
      status,
      responseTime,
      details,
    };

    this.addMetric(metric);

    // Log critical health issues
    if (status === 'unhealthy') {
      console.warn(`Health Alert: ${service} is unhealthy`, details);
    }
  }

  /**
   * Manually record external health metric
   */
  recordExternalHealth(
    service: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTime?: number,
    errorRate?: number,
    details?: Record<string, any>
  ) {
    if (!this.config.enabled || !this.config.trackSystemHealth) return;

    const metric: HealthMetric = {
      id: this.generateId(),
      type: 'api_availability',
      timestamp: new Date(),
      service,
      status,
      responseTime,
      errorRate,
      details,
    };

    this.addMetric(metric);
  }

  /**
   * Add metric to buffer
   */
  private addMetric(metric: HealthMetric) {
    this.healthBuffer.push(metric);

    if (this.healthBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush metrics to storage
   */
  async flush() {
    if (this.healthBuffer.length === 0) return;

    const metricsToFlush = [...this.healthBuffer];
    this.healthBuffer = [];

    try {
      await this.storeMetrics(metricsToFlush);
    } catch (error) {
      console.error('Failed to flush health metrics:', error);
      // Re-add metrics to buffer for retry
      this.healthBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Store metrics to configured storage
   */
  private async storeMetrics(metrics: HealthMetric[]) {
    if (this.config.storage.type === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from(this.config.storage.tableName || 'ai_analytics')
        .insert(
          metrics.map(metric => ({
            ...metric,
            metric_type: 'health',
            timestamp: metric.timestamp.toISOString(),
          }))
        );

      if (error) {
        throw new Error(`Supabase storage error: ${error.message}`);
      }
    } else if (this.config.storage.type === 'memory') {
      // Store in memory for testing
      console.log('Health metrics (memory storage):', metrics);
    }
  }

  /**
   * Generate unique ID for metrics
   */
  private generateId(): string {
    return `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get health summary for a time period
   */
  async getHealthSummary(startDate: Date, endDate: Date, service?: string) {
    if (!this.supabase) return null;

    let query = this.supabase
      .from(this.config.storage.tableName || 'ai_analytics')
      .select('*')
      .eq('metric_type', 'health')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (service) {
      query = query.eq('service', service);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get health summary:', error);
      return null;
    }

    return this.aggregateHealthData(data || []);
  }

  /**
   * Aggregate health data for reporting
   */
  private aggregateHealthData(metrics: any[]) {
    const services = Array.from(new Set(metrics.map(m => m.service)));
    const serviceHealth = services.map(service => {
      const serviceMetrics = metrics.filter(m => m.service === service);
      const latest = serviceMetrics.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      const healthyCount = serviceMetrics.filter(m => m.status === 'healthy').length;
      const totalCount = serviceMetrics.length;

      return {
        service,
        currentStatus: latest?.status || 'unknown',
        availability: totalCount > 0 ? (healthyCount / totalCount) * 100 : 0,
        averageResponseTime: serviceMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / Math.max(serviceMetrics.length, 1),
        lastCheck: latest?.timestamp,
      };
    });

    return {
      overall: {
        healthyServices: serviceHealth.filter(s => s.currentStatus === 'healthy').length,
        totalServices: services.length,
        averageAvailability: serviceHealth.reduce((sum, s) => sum + s.availability, 0) / Math.max(services.length, 1),
      },
      services: serviceHealth,
      alerts: metrics.filter(m => m.status === 'unhealthy').slice(0, 10),
    };
  }

  /**
   * Get current system status
   */
  async getCurrentStatus() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return this.getHealthSummary(fiveMinutesAgo, now);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    // Flush any remaining metrics
    this.flush();
  }
}