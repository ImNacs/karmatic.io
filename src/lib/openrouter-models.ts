/**
 * @fileoverview OpenRouter model configurations and utilities
 * @module lib/openrouter-models
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing: {
    prompt: number;  // $ per 1M tokens
    completion: number;  // $ per 1M tokens
  };
}

/**
 * Popular OpenRouter models with their configurations
 */
export const OPENROUTER_MODELS: Record<string, OpenRouterModel> = {
  // Anthropic models
  'anthropic/claude-3-5-sonnet': {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent Claude model, best for complex tasks',
    contextLength: 200000,
    pricing: { prompt: 3, completion: 15 }
  },
  'anthropic/claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and affordable Claude model',
    contextLength: 200000,
    pricing: { prompt: 0.25, completion: 1.25 }
  },

  // OpenAI models
  'openai/gpt-4-turbo-preview': {
    id: 'openai/gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    description: 'Latest GPT-4 with improved performance',
    contextLength: 128000,
    pricing: { prompt: 10, completion: 30 }
  },
  'openai/gpt-3.5-turbo': {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective',
    contextLength: 16385,
    pricing: { prompt: 0.5, completion: 1.5 }
  },

  // Google models
  'google/gemini-pro': {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Google\'s advanced model',
    contextLength: 32768,
    pricing: { prompt: 0.125, completion: 0.375 }
  },

  // Meta models
  'meta-llama/llama-3-70b-instruct': {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Open source, powerful model',
    contextLength: 8192,
    pricing: { prompt: 0.7, completion: 0.9 }
  },
  'meta-llama/llama-3-8b-instruct': {
    id: 'meta-llama/llama-3-8b-instruct',
    name: 'Llama 3 8B',
    description: 'Smaller, faster Llama model',
    contextLength: 8192,
    pricing: { prompt: 0.1, completion: 0.1 }
  },

  // Mistral models
  'mistralai/mistral-large': {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'Mistral\'s flagship model',
    contextLength: 32768,
    pricing: { prompt: 8, completion: 24 }
  },
};

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): OpenRouterModel | undefined {
  return OPENROUTER_MODELS[modelId];
}

/**
 * Get recommended model based on use case
 */
export function getRecommendedModel(useCase: 'quality' | 'speed' | 'cost'): string {
  switch (useCase) {
    case 'quality':
      return 'anthropic/claude-3-5-sonnet';
    case 'speed':
      return 'anthropic/claude-3-haiku';
    case 'cost':
      return 'meta-llama/llama-3-8b-instruct';
    default:
      return 'anthropic/claude-3-5-sonnet';
  }
}