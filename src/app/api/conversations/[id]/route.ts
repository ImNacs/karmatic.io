/**
 * @fileoverview API endpoint to load conversation by ID
 * @module app/api/conversations/[id]
 */

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { loadConversationFromDatabase } from '@/lib/conversation-manager'
import { getOrCreateSearchSession } from '@/lib/search-tracking'
import { createClient } from '@supabase/supabase-js'

/** Force Node.js runtime for this route */
export const runtime = 'nodejs'

/** Supabase client with service role for full access */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Load conversation messages by ID
 * @method GET
 * @param {Request} request - Request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters
 * @returns {Promise<Response>} JSON response with conversation messages
 * @response {Object} 200 - Success response
 * @response {boolean} response.success - Success status
 * @response {string} response.conversationId - Conversation ID
 * @response {Array} response.messages - Conversation messages
 * @response {number} response.count - Message count
 * @response {Object} 500 - Server error
 * @example
 * // GET /api/conversations/abc123
 * // Response:
 * {
 *   "success": true,
 *   "conversationId": "abc123",
 *   "messages": [
 *     {
 *       "id": "1",
 *       "role": "user",
 *       "content": "Busco agencias Toyota",
 *       "timestamp": "2024-01-01T12:00:00Z"
 *     },
 *     {
 *       "id": "2",
 *       "role": "assistant",
 *       "content": "He encontrado 5 agencias...",
 *       "timestamp": "2024-01-01T12:00:05Z"
 *     }
 *   ],
 *   "count": 2
 * }
 */
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
      dbUserId ?? undefined,
      sessionId ?? undefined
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