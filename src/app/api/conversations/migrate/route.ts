import { auth } from '@clerk/nextjs/server'
import { migrateSessionStorageToDatabase } from '@/lib/conversation-manager'
import { getOrCreateSearchSession } from '@/lib/search-tracking'

export const runtime = 'nodejs'

interface MigrationRequest {
  searchId: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
    metadata?: any
  }>
  context?: {
    query?: string
    location?: string
    [key: string]: any
  }
}

export async function POST(request: Request) {
  try {
    const body: MigrationRequest = await request.json()
    console.log('🔄 Migration API: Request received for', body.searchId)

    if (!body.searchId || !body.messages || !Array.isArray(body.messages)) {
      return Response.json(
        { error: 'searchId and messages array are required' },
        { status: 400 }
      )
    }

    // Check authentication
    const authData = await auth()
    const userId = authData?.userId

    // Get session for anonymous users
    let sessionId = null
    if (!userId) {
      sessionId = await getOrCreateSearchSession()
    }

    // Transform messages to match our ChatMessage interface
    const chatMessages = body.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      metadata: msg.metadata
    }))

    // Migrate to database
    const success = await migrateSessionStorageToDatabase(
      body.searchId,
      chatMessages,
      userId ?? undefined,
      sessionId ?? undefined,
      body.context
    )

    if (success) {
      console.log('✅ Migration successful for', body.searchId)
      return Response.json({
        success: true,
        message: 'Conversation migrated successfully',
        searchId: body.searchId,
        messagesCount: chatMessages.length
      })
    } else {
      console.error('❌ Migration failed for', body.searchId)
      return Response.json(
        { error: 'Failed to migrate conversation to database' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Migration API Error:', error)
    return Response.json(
      { 
        error: 'Failed to migrate conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}