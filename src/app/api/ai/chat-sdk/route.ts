/**
 * @fileoverview Alternative chat endpoint using Next.js AI SDK with OpenRouter
 * @module api/ai/chat-sdk
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';

// Configure OpenRouter provider
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Authentication check
    const authData = await auth();
    
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get model from headers or use default
    const modelId = request.headers.get('X-Model-Id') || 'anthropic/claude-3-5-sonnet';
    
    // Stream response using AI SDK
    const result = await streamText({
      model: openrouter(modelId),
      messages,
      // Optional: Add system message
      system: 'You are a helpful assistant.',
      // Optional: Configure generation
      temperature: 0.7,
      maxTokens: 1000,
      // Optional: Add user info to headers for OpenRouter analytics
      headers: {
        'HTTP-Referer': 'https://karmatic.io',
        'X-Title': 'Karmatic AI Assistant',
      },
    });
    
    // Return the streaming response
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('AI Chat SDK Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isProviderError = errorMessage.includes('API key') || errorMessage.includes('provider');
    
    return new Response(
      JSON.stringify({ 
        error: isProviderError 
          ? 'AI service configuration error. Please check API keys.'
          : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
      { 
        status: isProviderError ? 503 : 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}