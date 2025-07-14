import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TransferRequest {
  anonymousSessionId: string
}

export async function POST(request: Request) {
  try {
    const body: TransferRequest = await request.json()
    console.log('🔄 Transfer API: Request received')

    if (!body.anonymousSessionId) {
      return Response.json(
        { error: 'anonymousSessionId is required' },
        { status: 400 }
      )
    }

    // Check authentication - user must be authenticated to transfer
    const authData = await auth()
    const userId = authData?.userId

    if (!userId) {
      return Response.json(
        { error: 'User must be authenticated to transfer conversations' },
        { status: 401 }
      )
    }

    console.log('🔍 Transferring conversations from session:', body.anonymousSessionId, 'to user:', userId)

    // Get database user ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('clerkUserId', userId)
      .single()

    if (userError || !user) {
      console.error('❌ User not found in database:', userError)
      return Response.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const dbUserId = user.id

    // Find all conversations for this anonymous session
    const { data: anonymousConversations, error: findError } = await supabase
      .from('conversations')
      .select('id, title, metadata, created_at')
      .eq('session_id', body.anonymousSessionId)
      .is('user_id', null)

    if (findError) {
      console.error('❌ Error finding anonymous conversations:', findError)
      return Response.json(
        { error: 'Failed to find anonymous conversations' },
        { status: 500 }
      )
    }

    if (!anonymousConversations || anonymousConversations.length === 0) {
      console.log('ℹ️ No anonymous conversations found to transfer')
      return Response.json({
        success: true,
        message: 'No conversations to transfer',
        transferred: 0
      })
    }

    console.log('📋 Found', anonymousConversations.length, 'conversations to transfer')

    // Transfer conversations to the authenticated user
    const conversationIds = anonymousConversations.map(conv => conv.id)
    
    const { error: transferError } = await supabase
      .from('conversations')
      .update({
        user_id: dbUserId,
        session_id: null, // Clear session_id since it's now owned by user
        metadata: {
          ...anonymousConversations[0]?.metadata,
          transferredAt: new Date().toISOString(),
          transferredFrom: 'anonymous_session',
          originalSessionId: body.anonymousSessionId
        }
      })
      .in('id', conversationIds)

    if (transferError) {
      console.error('❌ Error transferring conversations:', transferError)
      return Response.json(
        { error: 'Failed to transfer conversations' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully transferred', conversationIds.length, 'conversations')

    return Response.json({
      success: true,
      message: 'Conversations transferred successfully',
      transferred: conversationIds.length,
      conversationIds
    })

  } catch (error) {
    console.error('❌ Transfer API Error:', error)
    return Response.json(
      { 
        error: 'Failed to transfer conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}