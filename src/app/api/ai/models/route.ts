/**
 * @fileoverview API endpoint to get available OpenRouter models
 * @module api/ai/models
 */

import { NextResponse } from 'next/server';
import { OPENROUTER_MODELS } from '@/lib/openrouter-models';

export const runtime = 'edge';

/**
 * GET /api/ai/models
 * Returns available OpenRouter models and their configurations
 */
export async function GET() {
  try {
    // Optionally fetch live model list from OpenRouter
    // const response = await fetch('https://openrouter.ai/api/v1/models', {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    //   },
    // });
    // const data = await response.json();
    
    // Return our curated list
    return NextResponse.json({
      models: Object.values(OPENROUTER_MODELS),
      recommended: {
        quality: 'anthropic/claude-3-5-sonnet',
        speed: 'anthropic/claude-3-haiku',
        cost: 'meta-llama/llama-3-8b-instruct',
      }
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}