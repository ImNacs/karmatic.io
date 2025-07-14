/**
 * @fileoverview Basic agent configuration with OpenRouter
 * @module mastra/agents/basic
 */

import { Agent } from "@mastra/core";

/**
 * Basic agent using OpenRouter for model access
 * 
 * @remarks
 * This agent uses OpenRouter which provides access to multiple AI models
 * through a single API. You can change the model by updating the 'name' field.
 * 
 * Available models include:
 * - anthropic/claude-3-5-sonnet
 * - openai/gpt-4-turbo-preview
 * - google/gemini-pro
 * - meta-llama/llama-3-70b-instruct
 */
export const basicAgent = new Agent({
  name: "Basic Assistant",
  description: "A simple helpful assistant powered by OpenRouter",
  instructions: "You are a helpful assistant. Answer questions concisely and accurately.",
  model: {
    provider: "OPENROUTER",
    name: "anthropic/claude-3-5-sonnet", // High quality model
    // Alternative models:
    // name: "openai/gpt-4-turbo-preview",
    // name: "google/gemini-pro",
    // name: "meta-llama/llama-3-70b-instruct",
  },
});