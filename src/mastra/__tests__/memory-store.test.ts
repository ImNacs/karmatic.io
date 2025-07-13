/**
 * @fileoverview Tests for Memory store configuration and functionality
 * @module mastra/__tests__/memory-store
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@mastra/memory');
jest.mock('@mastra/pg');
jest.mock('@ai-sdk/openai');

import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { openai } from '@ai-sdk/openai';
import { createMemoryStore, getMemoryStore, memoryConfig } from '../config/memory-store';

describe('Memory Store Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the singleton instance
    (getMemoryStore as any).memoryInstance = null;
  });

  describe('createMemoryStore', () => {
    test('should create memory store with correct configuration', () => {
      // Mock environment variables
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const memory = createMemoryStore();

      expect(Memory).toHaveBeenCalledWith({
        storage: expect.any(PostgresStore),
        embedder: expect.any(Object),
        options: expect.objectContaining({
          lastMessages: 15,
          semanticRecall: expect.objectContaining({
            topK: 3,
            messageRange: { before: 2, after: 1 },
            scope: 'resource'
          }),
          workingMemory: expect.objectContaining({
            enabled: true,
            scope: 'resource',
            template: expect.stringContaining('User Profile for Vehicle Search')
          }),
          threads: expect.objectContaining({
            generateTitle: expect.objectContaining({
              instructions: expect.stringContaining('vehicle search conversation')
            })
          })
        })
      });
    });

    test('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      process.env.OPENAI_API_KEY = 'sk-test-key';

      expect(() => createMemoryStore()).toThrow('Missing required environment variables');
    });

    test('should throw error when OPENAI_API_KEY is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      delete process.env.OPENAI_API_KEY;

      expect(() => createMemoryStore()).toThrow('Missing required environment variables');
    });

    test('should use openai text-embedding-3-small for embeddings', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      createMemoryStore();

      expect(openai.embedding).toHaveBeenCalledWith('text-embedding-3-small');
    });
  });

  describe('getMemoryStore singleton', () => {
    test('should return same instance on multiple calls', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const memory1 = getMemoryStore();
      const memory2 = getMemoryStore();

      expect(memory1).toBe(memory2);
      expect(Memory).toHaveBeenCalledTimes(1);
    });
  });

  describe('memoryConfig environments', () => {
    test('should have correct development configuration', () => {
      const devConfig = memoryConfig.development;

      expect(devConfig.lastMessages).toBe(10);
      expect(devConfig.semanticRecall.topK).toBe(2);
      expect(devConfig.semanticRecall.messageRange).toEqual({ before: 1, after: 1 });
    });

    test('should have correct production configuration', () => {
      const prodConfig = memoryConfig.production;

      expect(prodConfig.lastMessages).toBe(15);
      expect(prodConfig.semanticRecall.topK).toBe(3);
      expect(prodConfig.semanticRecall.messageRange).toEqual({ before: 2, after: 1 });
    });

    test('should have correct test configuration', () => {
      const testConfig = memoryConfig.test;

      expect(testConfig.lastMessages).toBe(5);
      expect(testConfig.semanticRecall).toBe(false);
    });
  });

  describe('Working Memory Template', () => {
    test('should include vehicle-specific sections', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      createMemoryStore();

      const callArgs = (Memory as jest.Mock).mock.calls[0][0];
      const template = callArgs.options.workingMemory.template;

      expect(template).toContain('Vehicle Preferences');
      expect(template).toContain('Budget Range');
      expect(template).toContain('Vehicle Type');
      expect(template).toContain('Brand Preferences');
      expect(template).toContain('Current Search Context');
    });

    test('should enable resource-scoped working memory', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      createMemoryStore();

      const callArgs = (Memory as jest.Mock).mock.calls[0][0];
      expect(callArgs.options.workingMemory.scope).toBe('resource');
    });
  });

  describe('Thread Title Generation', () => {
    test('should use gpt-4o-mini for cost optimization', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      createMemoryStore();

      expect(openai).toHaveBeenCalledWith('gpt-4o-mini');
    });

    test('should have vehicle-specific title instructions', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      createMemoryStore();

      const callArgs = (Memory as jest.Mock).mock.calls[0][0];
      const instructions = callArgs.options.threads.generateTitle.instructions;

      expect(instructions).toContain('vehicle search conversation');
      expect(instructions).toContain('location, vehicle type');
      expect(instructions).toContain('Honda dealers in San Jose');
    });
  });

  describe('Semantic Recall Configuration', () => {
    test('should be configured for vehicle search context', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      createMemoryStore();

      const callArgs = (Memory as jest.Mock).mock.calls[0][0];
      const semanticRecall = callArgs.options.semanticRecall;

      expect(semanticRecall.topK).toBe(3);
      expect(semanticRecall.messageRange.before).toBe(2);
      expect(semanticRecall.messageRange.after).toBe(1);
      expect(semanticRecall.scope).toBe('resource');
    });
  });
});