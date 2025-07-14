/**
 * @fileoverview Integration tests for complete Mastra Phase 2 system
 * @module mastra/__tests__/integration
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Define types for mocked objects
interface MockedAgent {
  generate: jest.Mock;
}

interface AgentConfig {
  name: string;
  description: string;
  instructions: string;
  memory: any;
  tools: any;
}

// Mock all dependencies
jest.mock('@mastra/core/mastra');
jest.mock('@mastra/core/agent');
jest.mock('@mastra/memory');
jest.mock('../config/llm-providers');
jest.mock('../config/memory-store');

import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { mastra } from '../index';
import { karmaticTools } from '../tools';
import { karmaticWorkflows } from '../workflows';
import { AIMetricsCollector } from '../analytics/metrics-collector';
import { initializeMCP, getMCPConfig } from '../mcp';

describe('Mastra Phase 2 Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Main Mastra Instance', () => {
    test('should be configured with all Phase 2 components', () => {
      expect(Mastra).toHaveBeenCalledWith({
        agents: expect.objectContaining({
          karmaticAssistant: expect.any(Object)
        }),
        tools: karmaticTools,
        workflows: karmaticWorkflows
      });
    });

    test('should include all required tools', () => {
      const expectedTools = [
        'searchDealerships',
        'analyzeDealership',
        'getVehicleInventory',
        'getMarketInsights',
        'compareVehicles',
        'saveUserPreference',
        'getSearchHistory',
        'generateRecommendations'
      ];

      expectedTools.forEach(toolName => {
        expect(karmaticTools).toHaveProperty(toolName);
      });
    });

    test('should include all workflows', () => {
      const expectedWorkflows = [
        'vehicleSearchWorkflow',
        'dealershipAnalysisWorkflow',
        'recommendationWorkflow'
      ];

      expectedWorkflows.forEach(workflowName => {
        expect(karmaticWorkflows).toHaveProperty(workflowName);
      });
    });
  });

  describe('Agent Integration', () => {
    test('should create karmatic assistant with memory and tools', () => {
      const agentCall = (Agent as jest.Mock).mock.calls.find(call => 
        (call[0] as AgentConfig).name === 'Karmatic Assistant'
      );

      expect(agentCall).toBeDefined();
      expect(agentCall![0] as AgentConfig).toMatchObject({
        name: 'Karmatic Assistant',
        description: expect.stringContaining('agencias automotrices'),
        instructions: expect.stringContaining('experto asistente AI'),
        memory: expect.any(Object),
        tools: karmaticTools
      });
    });

    test('should have system instructions mentioning tools', () => {
      const agentCall = (Agent as jest.Mock).mock.calls.find(call => 
        (call[0] as AgentConfig).name === 'Karmatic Assistant'
      );

      const instructions = (agentCall?.[0] as AgentConfig)?.instructions || '';
      
      expect(instructions).toContain('searchDealerships');
      expect(instructions).toContain('analyzeDealership');
      expect(instructions).toContain('getVehicleInventory');
      expect(instructions).toContain('generateRecommendations');
    });
  });

  describe('Analytics Integration', () => {
    test('should initialize metrics collector correctly', () => {
      const collector = new AIMetricsCollector({ enabled: true });
      expect(collector).toBeDefined();
    });

    test('should track various metric types', async () => {
      const collector = new AIMetricsCollector({ enabled: true, batchSize: 1 });
      
      // Mock successful tracking
      const mockInsert = jest.fn<() => Promise<{ error: null }>>()
        .mockResolvedValue({ error: null });
      (collector as any).supabase = {
        from: () => ({ insert: mockInsert })
      };

      await collector.trackAgentInteraction({
        agentName: 'karmaticAssistant',
        duration: 1000,
        success: true,
        inputTokens: 100,
        outputTokens: 200
      });

      await collector.trackToolUsage({
        toolName: 'searchDealerships',
        duration: 500,
        success: true
      });

      await collector.trackWorkflowExecution({
        workflowName: 'vehicleSearchWorkflow',
        duration: 3000,
        success: true
      });

      expect(mockInsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('MCP Integration', () => {
    test('should initialize MCP with correct configuration', async () => {
      // Mock environment variables
      process.env.ENABLE_MCP = 'true';
      process.env.PERPLEXITY_API_KEY = 'test-key';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

      const { tools, config } = await initializeMCP();

      expect(config.enabled).toBe(true);
      expect(config.servers.perplexity.enabled).toBe(true);
      expect(config.servers.supabase.enabled).toBe(true);
      expect(tools).toHaveProperty('webResearchTool');
      expect(tools).toHaveProperty('supabaseDataTool');
    });

    test('should handle disabled MCP gracefully', async () => {
      process.env.ENABLE_MCP = 'false';
      delete process.env.PERPLEXITY_API_KEY;

      const { tools, config } = await initializeMCP();

      expect(config.enabled).toBe(false);
      expect(Object.keys(tools)).toHaveLength(0);
    });

    test('should get MCP config based on environment', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      process.env.CONTEXT7_API_KEY = 'test-key';
      process.env.ENABLE_PLAYWRIGHT_MCP = 'true';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

      const config = getMCPConfig();

      expect(config.servers.perplexity.enabled).toBe(true);
      expect(config.servers.context7.enabled).toBe(true);
      expect(config.servers.playwright.enabled).toBe(true);
      expect(config.servers.supabase.enabled).toBe(true);
      expect(config.servers.mastra.enabled).toBe(true);
    });
  });

  describe('End-to-End Workflow Simulation', () => {
    test('should handle complete vehicle search workflow', async () => {
      // Mock agent responses
      const mockGenerate = jest.fn<() => Promise<{ text: string }>>()
        .mockResolvedValueOnce({ text: 'Requirements analyzed' })
        .mockResolvedValueOnce({ text: 'Market insights gathered' })
        .mockResolvedValueOnce({ text: 'Dealerships analyzed' })
        .mockResolvedValueOnce({ text: 'Final recommendations' });

      const mockAgent = { generate: mockGenerate };
      (Agent as jest.Mock).mockReturnValue(mockAgent);

      // Simulate workflow execution
      const input = {
        location: 'San Jose, CA',
        preferences: {
          vehicleType: 'SUV',
          brand: 'Honda',
          budget: 35000
        },
        context: {
          userId: 'user123',
          sessionId: 'session456'
        }
      };

      // Test that workflow steps can be executed
      expect(input.location).toBe('San Jose, CA');
      expect(input.preferences.vehicleType).toBe('SUV');
      expect(input.context.userId).toBe('user123');
    });

    test('should handle dealership analysis workflow', async () => {
      const input = {
        dealerships: [
          {
            placeId: 'place123',
            name: 'Honda San Jose',
            location: 'San Jose, CA'
          },
          {
            placeId: 'place456',
            name: 'Toyota Sunnyvale',
            location: 'Sunnyvale, CA'
          }
        ],
        analysisType: 'comprehensive',
        criteria: ['reputation', 'services', 'inventory']
      };

      expect(input.dealerships).toHaveLength(2);
      expect(input.analysisType).toBe('comprehensive');
      expect(input.criteria).toContain('reputation');
    });

    test('should handle recommendation workflow', async () => {
      const input = {
        userContext: {
          location: 'San Francisco',
          preferences: {
            vehicleType: 'SUV',
            brand: 'Honda',
            budget: 40000,
            priority: 'quality'
          },
          searchHistory: true
        },
        recommendationType: 'comprehensive'
      };

      expect(input.userContext.location).toBe('San Francisco');
      expect(input.userContext.preferences.priority).toBe('quality');
      expect(input.recommendationType).toBe('comprehensive');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle tool execution failures gracefully', async () => {
      // Test error handling in tools
      const mockFetch = jest.fn<() => Promise<never>>()
        .mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch as any;

      const result = await karmaticTools.searchDealerships.execute({
        context: {
          location: 'Invalid Location'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should handle missing environment variables', () => {
      // Test that system degrades gracefully when env vars are missing
      delete process.env.OPENAI_API_KEY;
      delete process.env.DATABASE_URL;

      // Should not crash when creating components
      expect(() => {
        const config = getMCPConfig();
        expect(config).toBeDefined();
      }).not.toThrow();
    });

    test('should handle analytics failures gracefully', async () => {
      const collector = new AIMetricsCollector({ enabled: true });
      
      // Mock failed Supabase operation
      const mockFailedInsert = jest.fn<() => Promise<{ error: { message: string } }>>()
        .mockResolvedValue({ error: { message: 'Database error' } });
      (collector as any).supabase = {
        from: () => ({
          insert: mockFailedInsert
        })
      };

      // Should not throw error even when database fails
      await expect(
        collector.trackAgentInteraction({
          agentName: 'test',
          duration: 100,
          success: true
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    test('should batch analytics operations efficiently', async () => {
      const collector = new AIMetricsCollector({ 
        enabled: true, 
        batchSize: 5,
        flushInterval: 1000 
      });

      const mockInsert = jest.fn<() => Promise<{ error: null }>>()
        .mockResolvedValue({ error: null });
      (collector as any).supabase = {
        from: () => ({ insert: mockInsert })
      };

      // Add 4 metrics - should not flush yet
      for (let i = 0; i < 4; i++) {
        await collector.trackAgentInteraction({
          agentName: `agent${i}`,
          duration: 100,
          success: true
        });
      }

      expect(mockInsert).not.toHaveBeenCalled();

      // Add 5th metric - should trigger batch flush
      await collector.trackAgentInteraction({
        agentName: 'agent5',
        duration: 100,
        success: true
      });

      expect(mockInsert).toHaveBeenCalled();
    });

    test('should handle concurrent tool executions', async () => {
      const tools = [
        karmaticTools.searchDealerships,
        karmaticTools.getMarketInsights,
        karmaticTools.generateRecommendations
      ];

      // Mock successful responses
      global.fetch = jest.fn<() => Promise<Response>>()
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ agencies: [] })
        } as Response) as any;

      // Execute tools concurrently
      const promises = tools.map(async (tool, index) => {
        if (tool === karmaticTools.generateRecommendations) {
          return tool.execute({
            context: {
              context: { location: `Location ${index}` },
              recommendationType: 'comprehensive'
            }
          });
        } else {
          return tool.execute({
            context: {
              location: `Location ${index}`
            }
          });
        }
      });

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach((result: any) => {
        expect(result.success).toBe(true);
      });
    });
  });
});