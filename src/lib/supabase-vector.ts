import { createClient } from '@supabase/supabase-js';
import type { 
  DocumentMetadata, 
  HybridSearchResult, 
  ConversationSummary,
  ConversationMessage 
} from '@/types/supabase';

// Initialize Supabase client for vector operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseVector = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Perform hybrid search combining semantic and full-text search
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