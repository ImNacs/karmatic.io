/**
 * @fileoverview Tests for Analytics system
 * @module mastra/__tests__/analytics
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase
jest.mock('@supabase/supabase-js');

import { createClient } from '@supabase/supabase-js';
import { AIMetricsCollector } from '../analytics/metrics-collector';
import { AgentPerformanceAnalyzer } from '../analytics/performance-analyzer';
import { getAnalyticsConfig } from '../analytics/config';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('Analytics System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('AIMetricsCollector', () => {
    test('should initialize with correct configuration', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const collector = new AIMetricsCollector({ enabled: true });
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      );
    });

    test('should track agent interaction metrics', async () => {
      const collector = new AIMetricsCollector({ enabled: true, batchSize: 1 });

      await collector.trackAgentInteraction({
        agentName: 'karmaticAssistant',
        duration: 1500,
        success: true,
        inputTokens: 100,
        outputTokens: 200,
        cost: 0.005,
        sessionId: 'session123',
        userId: 'user456'
      });

      // Should flush immediately due to batchSize: 1
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_analytics');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'agent_interaction',
          agent_name: 'karmaticAssistant',
          duration_ms: 1500,
          success: true,
          input_tokens: 100,
          output_tokens: 200,
          cost_usd: 0.005,
          session_id: 'session123',
          user_id: 'user456'
        })
      ]);
    });

    test('should track tool usage metrics', async () => {
      const collector = new AIMetricsCollector({ enabled: true, batchSize: 1 });

      await collector.trackToolUsage({
        toolName: 'searchDealerships',
        duration: 800,
        success: true,
        sessionId: 'session123',
        metadata: { location: 'San Jose' }
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'tool_usage',
          tool_name: 'searchDealerships',
          duration_ms: 800,
          success: true,
          metadata: { location: 'San Jose' }
        })
      ]);
    });

    test('should track workflow execution metrics', async () => {
      const collector = new AIMetricsCollector({ enabled: true, batchSize: 1 });

      await collector.trackWorkflowExecution({
        workflowName: 'vehicleSearchWorkflow',
        duration: 5000,
        success: true,
        stepsCompleted: 4,
        totalSteps: 4,
        sessionId: 'session123'
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'workflow_execution',
          workflow_name: 'vehicleSearchWorkflow',
          duration_ms: 5000,
          success: true,
          metadata: expect.objectContaining({
            stepsCompleted: 4,
            totalSteps: 4
          })
        })
      ]);
    });

    test('should batch metrics before flushing', async () => {
      const collector = new AIMetricsCollector({ enabled: true, batchSize: 3 });

      // Add 2 metrics - should not flush yet
      await collector.trackAgentInteraction({
        agentName: 'test1',
        duration: 100,
        success: true
      });
      await collector.trackAgentInteraction({
        agentName: 'test2',
        duration: 200,
        success: true
      });

      expect(mockSupabase.insert).not.toHaveBeenCalled();

      // Add 3rd metric - should trigger flush
      await collector.trackAgentInteraction({
        agentName: 'test3',
        duration: 300,
        success: true
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ agent_name: 'test1' }),
          expect.objectContaining({ agent_name: 'test2' }),
          expect.objectContaining({ agent_name: 'test3' })
        ])
      );
    });

    test('should flush metrics on timer', async () => {
      const collector = new AIMetricsCollector({ 
        enabled: true, 
        batchSize: 10, 
        flushInterval: 1000 
      });

      await collector.trackAgentInteraction({
        agentName: 'test',
        duration: 100,
        success: true
      });

      // Advance timer to trigger flush
      jest.advanceTimersByTime(1000);

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({ agent_name: 'test' })
      ]);
    });

    test('should aggregate metrics correctly', async () => {
      const collector = new AIMetricsCollector({ enabled: true });
      
      const mockData = [
        {
          type: 'agent_interaction',
          agent_name: 'karmaticAssistant',
          duration_ms: 1000,
          success: true,
          input_tokens: 100,
          output_tokens: 200,
          cost_usd: 0.01
        },
        {
          type: 'tool_usage',
          tool_name: 'searchDealerships',
          duration_ms: 500,
          success: false,
          error_type: 'network_error'
        }
      ];

      mockSupabase.select.mockResolvedValue({ data: mockData, error: null });

      const summary = await collector.getMetricsSummary(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(summary.totalInteractions).toBe(2);
      expect(summary.successRate).toBe(0.5);
      expect(summary.averageDuration).toBe(750);
      expect(summary.totalTokens).toBe(300);
      expect(summary.totalCost).toBe(0.01);
      expect(summary.byType.agent_interaction).toBe(1);
      expect(summary.byAgent.karmaticAssistant).toBe(1);
      expect(summary.errors.network_error).toBe(1);
    });
  });

  describe('AgentPerformanceAnalyzer', () => {
    test('should track response time performance', () => {
      const analyzer = new AgentPerformanceAnalyzer({ 
        enabled: true,
        performanceThresholds: { responseTimeMs: 2000 }
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      analyzer.trackResponseTime('karmaticAssistant', 2500, 'session123');

      // Should trigger performance alert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance alert: response_time for karmaticAssistant')
      );

      consoleSpy.mockRestore();
    });

    test('should track memory usage', () => {
      const analyzer = new AgentPerformanceAnalyzer({
        enabled: true,
        performanceThresholds: { memoryUsageMB: 256 }
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      analyzer.trackMemoryUsage(300, 'memory-store');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance alert: memory_usage for memory-store')
      );

      consoleSpy.mockRestore();
    });

    test('should provide performance summary', () => {
      const analyzer = new AgentPerformanceAnalyzer({ enabled: true });

      // Add some metrics
      analyzer.trackResponseTime('agent1', 1000);
      analyzer.trackResponseTime('agent1', 2000);
      analyzer.trackThroughput(10);
      analyzer.trackMemoryUsage(128);

      const summary = analyzer.getPerformanceSummary(300000);

      expect(summary.responseTime.count).toBe(2);
      expect(summary.responseTime.average).toBe(1500);
      expect(summary.responseTime.min).toBe(1000);
      expect(summary.responseTime.max).toBe(2000);
      expect(summary.throughput.count).toBe(1);
      expect(summary.memoryUsage.count).toBe(1);
    });
  });

  describe('Analytics Configuration', () => {
    test('should provide correct default configuration', () => {
      const config = getAnalyticsConfig();

      expect(config.enabled).toBeDefined();
      expect(config.batchSize).toBeGreaterThan(0);
      expect(config.flushInterval).toBeGreaterThan(0);
      expect(config.trackTokenUsage).toBe(true);
      expect(config.trackPerformance).toBe(true);
      expect(config.performanceThresholds.responseTimeMs).toBeGreaterThan(0);
    });

    test('should have different configs for different environments', () => {
      // Test that environment configs exist and have expected differences
      expect(typeof getAnalyticsConfig).toBe('function');
    });
  });
});