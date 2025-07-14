import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { loadConversationFromDatabase } from '@/lib/conversation-manager'
import { getOrCreateSearchSession } from '@/lib/search-tracking'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    console.log('📖 API: Loading conversation:', conversationId)

    // Check authentication
    const authData = await auth()
    const userId = authData?.userId

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
      dbUserId = user?.id?.toString() || null
    }

    // Load the conversation
    const messages = await loadConversationFromDatabase(
      conversationId,
      dbUserId,
      sessionId
    )

    return Response.json({
      success: true,
      conversationId,
      messages,
      count: messages.length
    })

  } catch (error) {
    console.error('❌ Error loading conversation:', error)
    return Response.json(
      { 
        error: 'Failed to load conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}