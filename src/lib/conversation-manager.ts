/**
 * @fileoverview Conversation management utilities for database operations
 * @module lib/conversation-manager
 */

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateSearchSession } from './search-tracking'

/** Supabase client with service role for full access */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Chat message structure
 * @interface ChatMessage
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string
  /** Message sender role */
  role: 'user' | 'assistant' | 'system'
  /** Message content */
  content: string
  /** Message timestamp */
  timestamp: Date
  /** Additional metadata */
  metadata?: any
}

/**
 * Full conversation with messages
 * @interface Conversation
 */
export interface Conversation {
  /** Conversation ID (same as search ID) */
  id: string
  /** Conversation title */
  title: string
  /** All messages in the conversation */
  messages: ChatMessage[]
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
  /** Additional metadata */
  metadata?: any
}

/**
 * Loads a conversation from the database by ID
 * @param {string} conversationId - Conversation/search ID to load
 * @param {string} [userId] - Clerk user ID for access control
 * @param {string} [sessionId] - Session ID for anonymous access
 * @returns {Promise<ChatMessage[]>} Array of chat messages
 * @example
 * ```ts
 * const messages = await loadConversationFromDatabase('abc123', userId);
 * ```
 */
export async function loadConversationFromDatabase(
  conversationId: string,
  userId?: string,
  sessionId?: string
): Promise<ChatMessage[]> {
  try {
    console.log('📖 Loading conversation from database:', conversationId)
    
    // First check if conversation exists and user has access
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, session_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.log('❌ Conversation not found or error:', convError)
      return []
    }

    // Verify access permissions
    const hasAccess = 
      (userId && conversation.user_id && conversation.user_id.toString() === userId) ||
      (sessionId && conversation.session_id === sessionId) ||
      (!conversation.user_id && !conversation.session_id) // Public conversation

    if (!hasAccess) {
      console.log('🚫 Access denied to conversation:', conversationId)
      return []
    }

    // Load messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: true })

    if (msgError) {
      console.error('❌ Error loading messages:', msgError)
      return []
    }

    // Transform to ChatMessage format
    const chatMessages: ChatMessage[] = (messages || []).map(msg => ({
      id: msg.id.toString(),
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(msg.created_at),
      metadata: msg.metadata
    }))

    console.log('✅ Loaded', chatMessages.length, 'messages from database')
    return chatMessages

  } catch (error) {
    console.error('❌ Error loading conversation from database:', error)
    return []
  }
}

/**
 * Client-side version that works in the browser
 * @param {string} conversationId - Conversation ID to load
 * @returns {Promise<ChatMessage[]>} Array of chat messages
 * @example
 * ```ts
 * const messages = await loadConversationFromDatabaseClient('abc123');
 * ```
 */
export async function loadConversationFromDatabaseClient(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`)
    if (!response.ok) {
      console.log('❌ Failed to load conversation:', response.status)
      return []
    }

    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error('❌ Error loading conversation from API:', error)
    return []
  }
}

/**
 * Lists all conversations for a user or session
 * @param {string} [userId] - Clerk user ID
 * @param {string} [sessionId] - Session ID for anonymous users
 * @param {number} [limit=50] - Maximum conversations to return
 * @returns {Promise<Conversation[]>} Array of conversations with messages
 */
export async function listUserConversations(
  userId?: string,
  sessionId?: string,
  limit: number = 50
): Promise<Conversation[]> {
  try {
    let query = supabase
      .from('conversations')
      .select(`
        id,
        title,
        metadata,
        created_at,
        updated_at,
        messages:messages(
          id,
          content,
          role,
          message_index,
          created_at,
          metadata
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (userId) {
      // Get database user ID first
      const { data: user } = await supabase
        .from('User')
        .select('id')
        .eq('clerkUserId', userId)
        .single()

      if (user) {
        query = query.eq('user_id', user.id)
      }
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else {
      return []
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('❌ Error listing conversations:', error)
      return []
    }

    return (conversations || []).map(conv => ({
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      metadata: conv.metadata,
      messages: (conv.messages || [])
        .sort((a: any, b: any) => a.message_index - b.message_index)
        .map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        }))
    }))

  } catch (error) {
    console.error('❌ Error listing conversations:', error)
    return []
  }
}

/**
 * Checks if a conversation exists in the database
 * @param {string} conversationId - Conversation ID to check
 * @returns {Promise<boolean>} True if conversation exists
 */
export async function conversationExists(conversationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}

/**
 * Migrates sessionStorage conversations to database
 * @param {string} searchId - Search/conversation ID
 * @param {ChatMessage[]} messages - Messages to migrate
 * @param {string} [userId] - Clerk user ID
 * @param {string} [sessionId] - Session ID
 * @param {any} [context] - Search context metadata
 * @returns {Promise<boolean>} True if migration successful
 * @example
 * ```ts
 * const success = await migrateSessionStorageToDatabase(
 *   'abc123',
 *   messages,
 *   userId,
 *   sessionId,
 *   { query: 'Toyota dealers', location: 'CDMX' }
 * );
 * ```
 */
export async function migrateSessionStorageToDatabase(
  searchId: string,
  messages: ChatMessage[],
  userId?: string,
  sessionId?: string,
  context?: any
): Promise<boolean> {
  try {
    console.log('🔄 Migrating conversation to database:', searchId)

    // Get database user ID if authenticated
    let dbUserId = null
    if (userId) {
      const { data: user } = await supabase
        .from('User')
        .select('id')
        .eq('clerkUserId', userId)
        .single()
      dbUserId = user?.id || null
    }

    // Create conversation
    const { error: convError } = await supabase
      .from('conversations')
      .insert({
        id: searchId,
        user_id: dbUserId,
        session_id: sessionId,
        title: context?.query || 'Migrated conversation',
        metadata: {
          search: context || {},
          source: 'migration',
          migratedAt: new Date().toISOString()
        }
      })

    if (convError) {
      console.error('❌ Error creating conversation during migration:', convError)
      return false
    }

    // Insert messages
    const messageInserts = messages.map((msg, index) => ({
      conversation_id: searchId,
      content: msg.content,
      role: msg.role,
      message_index: index,
      metadata: {
        ...msg.metadata,
        migratedAt: new Date().toISOString(),
        originalTimestamp: msg.timestamp?.toISOString()
      }
    }))

    const { error: msgError } = await supabase
      .from('messages')
      .insert(messageInserts)

    if (msgError) {
      console.error('❌ Error inserting messages during migration:', msgError)
      return false
    }

    console.log('✅ Successfully migrated', messages.length, 'messages to database')
    return true

  } catch (error) {
    console.error('❌ Error during migration:', error)
    return false
  }
}