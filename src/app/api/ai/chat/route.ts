import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/mastra'

export const runtime = 'edge'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authData = await auth()
    
    const body: ChatRequest = await request.json()
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const lastMessage = body.messages[body.messages.length - 1]
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: 'Last message must be from user' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Get the basic agent
    const agent = mastra.getAgent('basic')
    
    if (!agent) {
      console.error('Basic agent not found')
      return new Response(
        JSON.stringify({ error: 'AI assistant not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Stream the response using the agent
    const stream = await agent.stream(body.messages)
    
    // Return the streaming response
    return stream.toDataStreamResponse()
    
  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    // Check if it's an LLM provider error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isProviderError = errorMessage.includes('API key') || errorMessage.includes('provider')
    
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
    )
  }
}

