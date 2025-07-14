/**
 * @fileoverview Basic agent configuration with OpenRouter
 * @module mastra/agents/basic
 */

import { Agent } from "@mastra/core";
import { createOpenAI } from "@ai-sdk/openai";

// Configure OpenRouter provider
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  headers: {
    'HTTP-Referer': 'https://karmatic.io',
    'X-Title': 'Karmatic AI Assistant',
  },
});

/**
 * Available models via OpenRouter
 * 
 * @remarks
 * Models are sorted by capability and use case:
 * 
 * Top Tier Models:
 * - anthropic/claude-3-5-sonnet - Best for general tasks ($3/1M in, $15/1M out)
 * - moonshotai/kimi-k2 - Specialized for agentic tasks, 128K context ($0.57/1M in, $2.30/1M out)
 * - openai/gpt-4-turbo-preview - Strong general model
 * 
 * Fast & Affordable:
 * - anthropic/claude-3-haiku - Very fast, good quality
 * - openai/gpt-3.5-turbo - Fast and cheap
 * 
 * Open Source:
 * - google/gemini-pro - Free tier available
 * - meta-llama/llama-3-70b-instruct - Open weights
 */

// Get model from environment or use default
const selectedModel = process.env.AI_MODEL || "moonshotai/kimi-k2";

console.log(`🤖 Using model: ${selectedModel}`);

/**
 * Basic agent using OpenRouter for model access
 */
export const basicAgent = new Agent({
  name: "Basic Assistant",
  description: "A helpful assistant powered by OpenRouter",
  instructions: "You are a helpful assistant. Answer questions concisely and accurately.",
  model: openrouter(selectedModel),
});