/**
 * @fileoverview Tests for multi-agent workflows
 * @module mastra/__tests__/workflows
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@mastra/core/workflow');
jest.mock('@mastra/core/agent');
jest.mock('../config/llm-providers');
jest.mock('../config/memory-store');
jest.mock('../tools');

import { Workflow, WorkflowStep } from '@mastra/core/workflow';
import { Agent } from '@mastra/core/agent';
import { 
  vehicleSearchWorkflow,
  dealershipAnalysisWorkflow,
  recommendationWorkflow 
} from '../workflows';

// Mock implementations
const mockGenerate = jest.fn();
const mockAgent = {
  generate: mockGenerate
};

(Agent as jest.Mock).mockImplementation(() => mockAgent);

describe('Multi-Agent Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Vehicle Search Workflow', () => {
    test('should be properly configured', () => {
      expect(Workflow).toHaveBeenCalledWith({
        id: 'vehicle-search-workflow',
        description: expect.stringContaining('vehicle search'),
        inputSchema: expect.any(Object),
        steps: expect.arrayContaining([
          expect.objectContaining({ id: 'requirement-analysis' }),
          expect.objectContaining({ id: 'market-analysis' }),
          expect.objectContaining({ id: 'dealership-search' }),
          expect.objectContaining({ id: 'synthesis-recommendations' })
        ]),
        stepDependencies: expect.objectContaining({
          'market-analysis': ['requirement-analysis'],
          'dealership-search': ['requirement-analysis'],
          'synthesis-recommendations': ['market-analysis', 'dealership-search']
        })
      });
    });

    test('should validate input schema', () => {
      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'vehicle-search-workflow'
      );
      
      const inputSchema = mockWorkflowCall[0].inputSchema;
      
      // Test valid input
      const validInput = {
        location: 'San Jose, CA',
        preferences: {
          vehicleType: 'SUV',
          brand: 'Honda',
          budget: 30000
        },
        context: {
          userId: 'user123',
          sessionId: 'session456'
        }
      };

      expect(() => inputSchema.parse(validInput)).not.toThrow();

      // Test minimal input
      const minimalInput = {
        location: 'San Jose, CA'
      };

      expect(() => inputSchema.parse(minimalInput)).not.toThrow();
    });

    test('should handle requirement analysis step', async () => {
      mockGenerate.mockResolvedValue({ text: 'Analysis complete' });

      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'vehicle-search-workflow'
      );
      
      const steps = mockWorkflowCall[0].steps;
      const requirementStep = steps.find((step: any) => step.id === 'requirement-analysis');

      const input = {
        location: 'San Jose, CA',
        preferences: {
          vehicleType: 'SUV',
          budget: 30000
        },
        context: {
          userId: 'user123',
          sessionId: 'session456'
        }
      };

      const result = await requirementStep.execute(input);

      expect(result.analysis).toBe('Analysis complete');
      expect(result.location).toBe('San Jose, CA');
      expect(result.preferences).toEqual(input.preferences);
    });
  });

  describe('Dealership Analysis Workflow', () => {
    test('should be properly configured', () => {
      expect(Workflow).toHaveBeenCalledWith({
        id: 'dealership-analysis-workflow',
        description: expect.stringContaining('dealership analysis'),
        inputSchema: expect.any(Object),
        steps: expect.arrayContaining([
          expect.objectContaining({ id: 'reputation-analysis' }),
          expect.objectContaining({ id: 'service-analysis' }),
          expect.objectContaining({ id: 'comprehensive-comparison' })
        ]),
        stepDependencies: expect.objectContaining({
          'comprehensive-comparison': ['reputation-analysis', 'service-analysis']
        })
      });
    });

    test('should validate dealership input schema', () => {
      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'dealership-analysis-workflow'
      );
      
      const inputSchema = mockWorkflowCall[0].inputSchema;
      
      const validInput = {
        dealerships: [
          {
            placeId: 'place123',
            name: 'Honda San Jose',
            location: 'San Jose, CA'
          },
          {
            placeId: 'place456',
            name: 'Toyota Sunnyvale'
          }
        ],
        analysisType: 'comprehensive',
        criteria: ['reputation', 'services', 'pricing']
      };

      expect(() => inputSchema.parse(validInput)).not.toThrow();

      // Test minimum required fields
      const minimalInput = {
        dealerships: [
          {
            placeId: 'place123',
            name: 'Test Dealer'
          }
        ]
      };

      expect(() => inputSchema.parse(minimalInput)).not.toThrow();
    });

    test('should handle parallel analysis steps', async () => {
      mockGenerate.mockResolvedValue({ text: 'Analysis result' });

      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'dealership-analysis-workflow'
      );
      
      const steps = mockWorkflowCall[0].steps;
      const reputationStep = steps.find((step: any) => step.id === 'reputation-analysis');
      const serviceStep = steps.find((step: any) => step.id === 'service-analysis');

      const input = {
        dealerships: [
          { placeId: 'place123', name: 'Test Dealer' }
        ],
        analysisType: 'comprehensive'
      };

      // Both steps should be able to run in parallel
      const [reputationResult, serviceResult] = await Promise.all([
        reputationStep.execute(input),
        serviceStep.execute(input)
      ]);

      expect(reputationResult.reputationResults).toHaveLength(1);
      expect(serviceResult.serviceResults).toHaveLength(1);
    });
  });

  describe('Recommendation Workflow', () => {
    test('should be properly configured', () => {
      expect(Workflow).toHaveBeenCalledWith({
        id: 'recommendation-workflow',
        description: expect.stringContaining('recommendation engine'),
        inputSchema: expect.any(Object),
        steps: expect.arrayContaining([
          expect.objectContaining({ id: 'contextual-analysis' }),
          expect.objectContaining({ id: 'strategic-recommendations' }),
          expect.objectContaining({ id: 'personalized-recommendations' })
        ]),
        stepDependencies: expect.objectContaining({
          'strategic-recommendations': ['contextual-analysis'],
          'personalized-recommendations': ['contextual-analysis', 'strategic-recommendations']
        })
      });
    });

    test('should validate recommendation input schema', () => {
      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'recommendation-workflow'
      );
      
      const inputSchema = mockWorkflowCall[0].inputSchema;
      
      const validInput = {
        userContext: {
          location: 'San Francisco',
          preferences: {
            vehicleType: 'SUV',
            brand: 'Honda',
            budget: 35000,
            features: ['AWD', 'Navigation'],
            priority: 'quality'
          },
          searchHistory: true
        },
        recommendationType: 'comprehensive',
        context: {
          userId: 'user123',
          sessionId: 'session456'
        }
      };

      expect(() => inputSchema.parse(validInput)).not.toThrow();

      // Test with minimal context
      const minimalInput = {
        userContext: {}
      };

      expect(() => inputSchema.parse(minimalInput)).not.toThrow();
    });

    test('should handle contextual analysis with search history', async () => {
      mockGenerate.mockResolvedValue({ text: 'Context analysis complete' });

      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'recommendation-workflow'
      );
      
      const steps = mockWorkflowCall[0].steps;
      const contextStep = steps.find((step: any) => step.id === 'contextual-analysis');

      const input = {
        userContext: {
          location: 'San Francisco',
          preferences: { vehicleType: 'SUV' },
          searchHistory: true
        },
        recommendationType: 'comprehensive'
      };

      const result = await contextStep.execute(input);

      expect(result.contextAnalysis).toBe('Context analysis complete');
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.stringContaining('Retrieve and analyze the user\'s search history'),
        input.context
      );
    });

    test('should handle contextual analysis without search history', async () => {
      mockGenerate.mockResolvedValue({ text: 'Basic context analysis' });

      const mockWorkflowCall = (Workflow as jest.Mock).mock.calls.find(
        call => call[0].id === 'recommendation-workflow'
      );
      
      const steps = mockWorkflowCall[0].steps;
      const contextStep = steps.find((step: any) => step.id === 'contextual-analysis');

      const input = {
        userContext: {
          location: 'Los Angeles',
          preferences: { budget: 25000 },
          searchHistory: false
        },
        recommendationType: 'vehicle_suggestions'
      };

      const result = await contextStep.execute(input);

      expect(result.contextAnalysis).toBe('Basic context analysis');
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.stringContaining('current context'),
        input.context
      );
    });
  });

  describe('Workflow Agent Configuration', () => {
    test('should create specialized agents with correct tools', () => {
      // Check that agents are created with appropriate tool configurations
      const agentCalls = (Agent as jest.Mock).mock.calls;

      // Should have search coordinator with specific tools
      const searchCoordinator = agentCalls.find(call => 
        call[0].name === 'Search Coordinator'
      );
      expect(searchCoordinator[0].tools).toHaveProperty('searchDealerships');
      expect(searchCoordinator[0].tools).toHaveProperty('generateRecommendations');

      // Should have market analyst with market tools
      const marketAnalyst = agentCalls.find(call => 
        call[0].name === 'Market Analyst'
      );
      expect(marketAnalyst[0].tools).toHaveProperty('getMarketInsights');
      expect(marketAnalyst[0].tools).toHaveProperty('compareVehicles');

      // Should have dealership specialist with dealership tools
      const dealershipSpecialist = agentCalls.find(call => 
        call[0].name === 'Dealership Specialist'
      );
      expect(dealershipSpecialist[0].tools).toHaveProperty('analyzeDealership');
      expect(dealershipSpecialist[0].tools).toHaveProperty('getVehicleInventory');
    });

    test('should configure agents with memory store', () => {
      const agentCalls = (Agent as jest.Mock).mock.calls;
      
      agentCalls.forEach(call => {
        expect(call[0]).toHaveProperty('memory');
      });
    });
  });
});