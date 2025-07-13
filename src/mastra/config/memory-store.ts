/**
 * @fileoverview Memory store configuration for Mastra AI system
 * @module mastra/config/memory-store
 * 
 * This module configures the persistent memory system using Supabase as the backend.
 * It provides conversation history, semantic search, and working memory capabilities.
 * 
 * @example
 * ```typescript
 * import { createMemoryStore } from '@/src/mastra/config/memory-store';
 * 
 * const memory = createMemoryStore();
 * ```
 */

import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { openai } from "@ai-sdk/openai";

/**
 * Environment validation for memory store configuration
 */
function validateMemoryEnvironment() {
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for memory store: ${missing.join(', ')}`
    );
  }

  return required;
}

/**
 * Creates a configured Memory instance with Supabase storage
 * 
 * @remarks
 * This memory store provides:
 * - Persistent conversation history in Supabase
 * - Semantic search using OpenAI embeddings
 * - Working memory for user context persistence
 * - Thread-based conversation organization
 * 
 * @returns {Memory} Configured Memory instance
 * 
 * @example
 * ```typescript
 * const memory = createMemoryStore();
 * 
 * const agent = new Agent({
 *   name: "Assistant",
 *   model: openai("gpt-4o"),
 *   memory
 * });
 * ```
 */
export function createMemoryStore(): Memory {
  // Validate environment variables
  const env = validateMemoryEnvironment();

  // Create PostgreSQL storage adapter for Supabase
  const storage = new PostgresStore({
    connectionString: env.DATABASE_URL,
  });

  // Create memory instance with comprehensive configuration
  const memory = new Memory({
    // Storage backend
    storage,
    
    // Vector embeddings for semantic search
    embedder: openai.embedding("text-embedding-3-small"),
    
    // Memory configuration
    options: {
      // Include last 15 messages for context
      lastMessages: 15,
      
      // Enable semantic recall with conservative settings
      semanticRecall: {
        topK: 3, // Retrieve 3 most similar messages
        messageRange: {
          before: 2, // Include 2 messages before each match
          after: 1,  // Include 1 message after each match
        },
        scope: 'resource', // Search across all user conversations
      },
      
      // Working memory for persistent user context
      workingMemory: {
        enabled: true,
        scope: 'resource', // Persist across all user conversations
        template: `# User Profile for Vehicle Search

## Personal Information
- **Name**: 
- **Location**: 
- **Preferred Language**: 

## Vehicle Preferences
- **Budget Range**: 
- **Vehicle Type**: [SUV, Sedan, Truck, etc.]
- **Brand Preferences**: 
- **Must-Have Features**: 
- **Deal Breakers**: 

## Current Search Context
- **Active Search Location**: 
- **Current Query**: 
- **Search History Summary**: 

## Conversation State
- **Last Discussion Topic**: 
- **Open Questions**: 
- **Recommended Actions**: 
`,
      },
      
      // Thread management
      threads: {
        generateTitle: {
          model: openai("gpt-4o-mini"), // Use cheaper model for titles
          instructions: "Generate a concise, descriptive title for this vehicle search conversation based on the user's initial message. Focus on location, vehicle type, or specific request. Examples: 'Honda dealers in San Jose', 'SUV financing options', 'Used car search in Miami'.",
        },
      },
    },
  });

  return memory;
}

/**
 * Cached memory instance to avoid recreating the store
 */
let memoryInstance: Memory | null = null;

/**
 * Gets or creates a singleton memory store instance
 * 
 * @returns {Memory} The shared Memory instance
 */
export function getMemoryStore(): Memory {
  if (!memoryInstance) {
    memoryInstance = createMemoryStore();
  }
  return memoryInstance;
}

/**
 * Memory store configuration for different environments
 */
export const memoryConfig = {
  // Development settings
  development: {
    lastMessages: 10,
    semanticRecall: {
      topK: 2,
      messageRange: { before: 1, after: 1 },
    },
  },
  
  // Production settings
  production: {
    lastMessages: 15,
    semanticRecall: {
      topK: 3,
      messageRange: { before: 2, after: 1 },
    },
  },
  
  // Test settings
  test: {
    lastMessages: 5,
    semanticRecall: false, // Disable for faster tests
  },
} as const;

export type MemoryEnvironment = keyof typeof memoryConfig;