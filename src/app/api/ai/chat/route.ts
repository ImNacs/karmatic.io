import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/src/mastra'
import { prepareContext, type AgentContext } from '@/src/mastra/agents/karmatic-assistant'

export const runtime = 'edge'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  searchId?: string
  context?: AgentContext
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
    
    // Get the Karmatic Assistant agent
    const agent = mastra.getAgent('karmaticAssistant')
    
    if (!agent) {
      console.error('Karmatic Assistant agent not found')
      return new Response(
        JSON.stringify({ error: 'AI assistant not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Prepare messages with context
    const contextString = prepareContext({
      ...body.context,
      user: authData?.userId ? {
        id: authData.userId,
      } : undefined
    })
    
    // Add context to the conversation if available
    const messagesWithContext = contextString 
      ? [
          ...body.messages.slice(0, -1),
          {
            role: 'user' as const,
            content: lastMessage.content + contextString
          }
        ]
      : body.messages
    
    // Stream the response using the agent
    const stream = await agent.stream(messagesWithContext)
    
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

