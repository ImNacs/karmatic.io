/**
 * Test endpoint - Direct streaming without Mastra
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Configure OpenRouter provider
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  headers: {
    'HTTP-Referer': 'https://karmatic.io',
    'X-Title': 'Karmatic Test',
  },
});

export async function POST(request: Request) {
  try {
    console.log('🧪 Test Direct: Starting...');
    
    const { messages } = await request.json();
    
    // Test direct streaming
    const result = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      messages,
      system: 'You are a helpful assistant. Answer concisely.',
    });
    
    console.log('✅ Test Direct: Streaming created');
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('❌ Test Direct Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}