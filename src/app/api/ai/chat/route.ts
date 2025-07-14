import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { mastra } from '@/mastra'
import { saveMessage, getOrCreateSearchSession } from '@/lib/search-tracking'
import { createClient } from '@supabase/supabase-js'

// Use nodejs runtime instead of edge due to Mastra dependencies
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

interface ChatRequest {
  messages: ChatMessage[]
  searchId?: string
  context?: {
    query?: string
    location?: string
    [key: string]: any
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 Chat API: Request received')
    
    // Authentication check
    const authData = await auth()
    const userId = authData?.userId
    console.log('👤 Chat API: Auth status:', userId ? 'authenticated' : 'anonymous')
    
    const body: ChatRequest = await request.json()
    console.log('📝 Chat API: Messages received:', body.messages?.length || 0)
    console.log('🔍 Chat API: SearchId:', body.searchId)
    console.log('🌍 Chat API: Context:', body.context)
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const lastMessage = body.messages[body.messages.length - 1]
    console.log('💬 Chat API: Last message:', lastMessage?.content?.slice(0, 50) + '...')
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: 'Last message must be from user' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get or create conversation for this searchId
    let conversationId = body.searchId
    if (!conversationId) {
      // Fallback: generate a conversation ID
      conversationId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Get session for anonymous users
    let sessionId = null
    if (!userId) {
      sessionId = await getOrCreateSearchSession()
    }

    // Get database user ID for authenticated users
    let dbUserId = null
    if (userId) {
      const { data: user } = await supabase
        .from('User')
        .select('id')
        .eq('clerkUserId', userId)
        .single()
      dbUserId = user?.id || null
    }

    // Check if conversation exists, if not create it
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single()

    if (!existingConversation) {
      console.log('📝 Creating new conversation:', conversationId)
      const { error: convError } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: dbUserId,
          session_id: sessionId,
          title: body.context?.query || 'Chat conversation',
          metadata: {
            search: body.context || {},
            source: 'chat_api'
          }
        })
      
      if (convError) {
        console.error('❌ Error creating conversation:', convError)
      } else {
        console.log('✅ Conversation created successfully')
      }
    }

    // Get the next message index
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('message_index')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: false })
      .limit(1)
      .single()

    const nextMessageIndex = (lastMsg?.message_index ?? -1) + 1

    // Save user message to database
    console.log('💾 Saving user message to database...')
    try {
      await saveMessage(
        conversationId,
        lastMessage.content,
        'user',
        nextMessageIndex,
        {
          timestamp: new Date().toISOString(),
          searchContext: body.context
        }
      )
      console.log('✅ User message saved')
    } catch (error: any) {
      console.error('❌ Error saving user message:', error)
      // Continue even if saving fails - don't block the chat
      if (error?.code === '42501') {
        console.warn('⚠️ Database permission issue - see docs/database-permissions-fix.md')
      }
    }
    
    // Get the basic agent
    const agent = mastra.getAgent('basic')
    console.log('🤖 Chat API: Agent found:', !!agent)
    
    if (!agent) {
      console.error('Basic agent not found')
      return new Response(
        JSON.stringify({ error: 'AI assistant not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Stream the response using the agent
    console.log('🌊 Chat API: Starting stream...')
    const stream = await agent.stream(body.messages)
    
    // Create a custom transform stream to capture assistant response
    let assistantResponse = ''
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Capture assistant response for database storage
        if (typeof chunk === 'string') {
          assistantResponse += chunk
        }
        controller.enqueue(chunk)
      },
      flush() {
        // Save assistant response to database when stream completes
        if (assistantResponse.trim()) {
          console.log('💾 Saving assistant response to database...')
          saveMessage(
            conversationId!,
            assistantResponse,
            'assistant',
            nextMessageIndex + 1,
            {
              timestamp: new Date().toISOString(),
              modelUsed: 'basic_agent'
            }
          ).then(() => {
            console.log('✅ Assistant response saved')
          }).catch((error: any) => {
            console.error('❌ Error saving assistant response:', error)
            if (error?.code === '42501') {
              console.warn('⚠️ Database permission issue - see docs/database-permissions-fix.md')
            }
          })
        }
      }
    })
    
    // Return the streaming response with database persistence
    console.log('✅ Chat API: Returning stream response with persistence')
    const response = stream.toDataStreamResponse()
    
    // Transform the response to capture content
    if (response.body) {
      const transformedBody = response.body.pipeThrough(transformStream)
      return new Response(transformedBody, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
      })
    }
    
    return response
    
  } catch (error) {
    console.error('❌ Chat API Error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Check if it's an LLM provider error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isProviderError = errorMessage.includes('API key') || errorMessage.includes('provider') || errorMessage.includes('OPENROUTER')
    
    console.error('Error details:', {
      message: errorMessage,
      isProviderError,
      hasApiKey: !!process.env.OPENROUTER_API_KEY,
      apiKeyPreview: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.slice(0, 10) + '...' : 'NOT SET'
    })
    
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

