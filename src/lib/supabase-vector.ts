/**
 * @fileoverview Supabase vector search and conversation utilities
 * @module lib/supabase-vector
 */

import { createClient } from '@supabase/supabase-js';
import type { 
  DocumentMetadata, 
  HybridSearchResult, 
  ConversationSummary,
  ConversationMessage 
} from '@/types/supabase';

/** Supabase URL from environment */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
/** Supabase anonymous key from environment */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Supabase client instance for vector operations */
export const supabaseVector = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Perform hybrid search combining semantic and full-text search
 * @param {Object} params - Search parameters
 * @param {string} params.queryText - Text query for full-text search
 * @param {number[]} [params.queryEmbedding] - Vector embedding for semantic search
 * @param {number} [params.matchCount=10] - Number of results to return
 * @param {number} [params.fullTextWeight=1] - Weight for full-text search
 * @param {number} [params.semanticWeight=1] - Weight for semantic search
 * @param {Partial<DocumentMetadata>} [params.filterMetadata={}] - Metadata filters
 * @returns {Promise<HybridSearchResult[]>} Search results
 * @throws {Error} If search fails
 */
export async function hybridSearch({
  queryText,
  queryEmbedding,
  matchCount = 10,
  fullTextWeight = 1,
  semanticWeight = 1,
  filterMetadata = {},
}: {
  queryText: string;
  queryEmbedding?: number[];
  matchCount?: number;
  fullTextWeight?: number;
  semanticWeight?: number;
  filterMetadata?: Partial<DocumentMetadata>;
}): Promise<HybridSearchResult[]> {
  const { data, error } = await supabaseVector.rpc('hybrid_search', {
    query_text: queryText,
    query_embedding: queryEmbedding,
    match_count: matchCount,
    full_text_weight: fullTextWeight,
    semantic_weight: semanticWeight,
    filter_metadata: filterMetadata,
  });

  if (error) {
    console.error('Hybrid search error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get user's conversation list
 * @param {string} userId - User ID
 * @param {number} [limit=20] - Maximum conversations to return
 * @returns {Promise<ConversationSummary[]>} List of conversation summaries
 * @throws {Error} If fetch fails
 */
export async function getUserConversations(
  userId: string,
  limit = 20
): Promise<ConversationSummary[]> {
  const { data, error } = await supabaseVector.rpc('get_user_conversations', {
    user_id: userId,
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get messages from a specific conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} [limit=50] - Maximum messages to return
 * @returns {Promise<ConversationMessage[]>} List of conversation messages
 * @throws {Error} If fetch fails
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50
): Promise<ConversationMessage[]> {
  const { data, error } = await supabaseVector.rpc('get_conversation_messages', {
    conversation_id: conversationId,
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search for agency-related documents
 * @param {string} location - Location to search
 * @param {string} [query] - Additional search query
 * @param {number} [limit=10] - Maximum results to return
 * @returns {Promise<HybridSearchResult[]>} Agency search results
 * @example
 * ```ts
 * const results = await searchAgencyDocuments('Ciudad de México', 'Toyota');
 * ```
 */
export async function searchAgencyDocuments(
  location: string,
  query?: string,
  limit = 10
): Promise<HybridSearchResult[]> {
  const searchText = query ? `${location} ${query}` : location;
  
  return hybridSearch({
    queryText: searchText,
    matchCount: limit,
    filterMetadata: {
      type: 'agency',
      location: location,
    },
  });
}

/**
 * Check if a conversation exists for a search
 * @param {string} userId - User ID
 * @param {string} location - Search location
 * @param {string} [query] - Search query
 * @returns {Promise<string | null>} Conversation ID if found, null otherwise
 */
export async function findConversationBySearch(
  userId: string,
  location: string,
  query?: string
): Promise<string | null> {
  const { data, error } = await supabaseVector
    .from('documents')
    .select('metadata')
    .eq('metadata->>type', 'conversation_message')
    .eq('metadata->>userId', userId)
    .contains('metadata', {
      searchContext: {
        location,
        query: query || '',
      },
    })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0].metadata.conversationId || null;
}