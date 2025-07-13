/**
 * @fileoverview Configuración multi-LLM para Mastra
 * @module config/llm-providers
 * 
 * Este módulo proporciona una interfaz unificada para trabajar con múltiples
 * proveedores de modelos de lenguaje (LLM). Soporta OpenAI, Anthropic, Google,
 * Mistral, Cohere y Amazon Bedrock.
 * 
 * @example
 * ```typescript
 * import { getModel, getDefaultModel } from './llm-providers';
 * 
 * // Usar modelo específico
 * const gpt4 = getModel('gpt-4o');
 * 
 * // Usar modelo predeterminado
 * const defaultModel = getDefaultModel();
 * ```
 */

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { cohere } from "@ai-sdk/cohere";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { LanguageModelV1 } from "@ai-sdk/provider";

/**
 * Tipos de proveedores LLM soportados
 */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'cohere' | 'bedrock';

/**
 * Configuración de un modelo LLM
 */
export interface ModelConfig {
  /** Proveedor del modelo */
  provider: LLMProvider;
  /** ID del modelo en el proveedor */
  modelId: string;
  /** Descripción legible del modelo */
  description: string;
  /** Costo por 1000 tokens (opcional) */
  costPer1kTokens?: {
    /** Costo de tokens de entrada */
    input: number;
    /** Costo de tokens de salida */
    output: number;
  };
}

/**
 * Catálogo de modelos disponibles con sus configuraciones
 * 
 * @example
 * ```typescript
 * // Acceder a información de un modelo
 * const gptInfo = AVAILABLE_MODELS['gpt-4o'];
 * console.log(gptInfo.description); // "Modelo GPT-4 más capaz, multimodal"
 * ```
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    description: 'Most capable GPT-4 model, multimodal',
    costPer1kTokens: { input: 0.005, output: 0.015 }
  },
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    description: 'Small, fast, cost-efficient model',
    costPer1kTokens: { input: 0.00015, output: 0.0006 }
  },
  'gpt-4-turbo': {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    description: 'GPT-4 Turbo with vision',
    costPer1kTokens: { input: 0.01, output: 0.03 }
  },
  
  // Anthropic Models
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    description: 'Most intelligent Claude model',
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },
  'claude-3-5-haiku': {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    description: 'Fast and cost-effective',
    costPer1kTokens: { input: 0.001, output: 0.005 }
  },
  'claude-3-opus': {
    provider: 'anthropic',
    modelId: 'claude-3-opus-20240229',
    description: 'Powerful model for complex tasks',
    costPer1kTokens: { input: 0.015, output: 0.075 }
  },
  
  // Google Models
  'gemini-2.0-flash': {
    provider: 'google',
    modelId: 'gemini-2.0-flash-exp',
    description: 'Fast multimodal model',
    costPer1kTokens: { input: 0.00025, output: 0.001 }
  },
  'gemini-1.5-pro': {
    provider: 'google',
    modelId: 'gemini-1.5-pro-latest',
    description: 'Advanced reasoning capabilities',
    costPer1kTokens: { input: 0.00125, output: 0.005 }
  },
  
  // Mistral Models
  'mistral-large': {
    provider: 'mistral',
    modelId: 'mistral-large-latest',
    description: 'Top-tier reasoning model',
    costPer1kTokens: { input: 0.003, output: 0.009 }
  },
  'mistral-small': {
    provider: 'mistral',
    modelId: 'mistral-small-latest',
    description: 'Cost-efficient model',
    costPer1kTokens: { input: 0.001, output: 0.003 }
  },
  
  // Cohere Models
  'command-r-plus': {
    provider: 'cohere',
    modelId: 'command-r-plus',
    description: 'Advanced RAG and tool use',
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },
  'command-r': {
    provider: 'cohere',
    modelId: 'command-r',
    description: 'Efficient for RAG and chat',
    costPer1kTokens: { input: 0.0005, output: 0.0015 }
  },
  
  // Bedrock Models (AWS)
  'claude-3-sonnet-bedrock': {
    provider: 'bedrock',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    description: 'Claude 3 Sonnet via AWS',
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },
  'llama-3-70b-bedrock': {
    provider: 'bedrock',
    modelId: 'meta.llama3-70b-instruct-v1:0',
    description: 'Llama 3 70B via AWS',
    costPer1kTokens: { input: 0.00265, output: 0.0035 }
  }
};

/**
 * Obtiene una instancia de modelo por su nombre
 * 
 * @param {string} modelName - Nombre del modelo (ej: 'gpt-4o', 'claude-3-5-sonnet')
 * @returns {LanguageModelV1} Instancia del modelo configurada
 * @throws {Error} Si el modelo no existe en AVAILABLE_MODELS
 * 
 * @example
 * ```typescript
 * const gpt4 = getModel('gpt-4o');
 * const claude = getModel('claude-3-5-sonnet');
 * ```
 */
export function getModel(modelName: string): LanguageModelV1 {
  const modelConfig = AVAILABLE_MODELS[modelName];
  
  if (!modelConfig) {
    throw new Error(`Model ${modelName} not found. Available models: ${Object.keys(AVAILABLE_MODELS).join(', ')}`);
  }
  
  const { provider, modelId } = modelConfig;
  
  switch (provider) {
    case 'openai':
      return openai(modelId);
    
    case 'anthropic':
      return anthropic(modelId);
    
    case 'google':
      return google(modelId);
    
    case 'mistral':
      return mistral(modelId);
    
    case 'cohere':
      return cohere(modelId);
    
    case 'bedrock':
      return bedrock(modelId);
    
    default:
      throw new Error(`Provider ${provider} not supported`);
  }
}

/**
 * Obtiene el modelo predeterminado basado en la variable de entorno DEFAULT_LLM_PROVIDER
 * 
 * @returns {LanguageModelV1} Instancia del modelo predeterminado
 * 
 * @example
 * ```typescript
 * // En .env.local: DEFAULT_LLM_PROVIDER=anthropic
 * const model = getDefaultModel(); // Retorna claude-3-5-haiku
 * ```
 */
export function getDefaultModel(): LanguageModelV1 {
  const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
  
  // Default models per provider
  const defaultModels: Record<LLMProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku',
    google: 'gemini-2.0-flash',
    mistral: 'mistral-small',
    cohere: 'command-r',
    bedrock: 'llama-3-70b-bedrock'
  };
  
  const modelName = defaultModels[defaultProvider as LLMProvider];
  return getModel(modelName);
}

/**
 * Verifica si un proveedor tiene las credenciales configuradas
 * 
 * @param {LLMProvider} provider - Nombre del proveedor a verificar
 * @returns {boolean} true si el proveedor tiene API key configurada
 * 
 * @example
 * ```typescript
 * if (isProviderConfigured('openai')) {
 *   console.log('OpenAI está disponible');
 * }
 * ```
 */
export function isProviderConfigured(provider: LLMProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'mistral':
      return !!process.env.MISTRAL_API_KEY;
    case 'cohere':
      return !!process.env.COHERE_API_KEY;
    case 'bedrock':
      return !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
    default:
      return false;
  }
}

/**
 * Obtiene la lista de todos los proveedores que tienen credenciales configuradas
 * 
 * @returns {LLMProvider[]} Array con los nombres de proveedores configurados
 * 
 * @example
 * ```typescript
 * const providers = getConfiguredProviders();
 * console.log(providers); // ['openai', 'anthropic']
 * ```
 */
export function getConfiguredProviders(): LLMProvider[] {
  const providers: LLMProvider[] = ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'bedrock'];
  return providers.filter(isProviderConfigured);
}

/**
 * Obtiene todos los modelos disponibles de los proveedores configurados
 * 
 * @returns {ModelConfig[]} Array con las configuraciones de modelos disponibles
 * 
 * @example
 * ```typescript
 * const models = getAvailableModels();
 * models.forEach(model => {
 *   console.log(`${model.provider}: ${model.modelId} - ${model.description}`);
 * });
 * ```
 */
export function getAvailableModels(): ModelConfig[] {
  const configuredProviders = getConfiguredProviders();
  return Object.values(AVAILABLE_MODELS).filter(
    model => configuredProviders.includes(model.provider)
  );
}