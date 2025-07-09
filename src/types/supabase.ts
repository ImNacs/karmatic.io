// Supabase Document Types for Karmatic RAG System

export interface DocumentMetadata {
  // Common fields
  type: 'agency' | 'agency_analysis' | 'conversation_message' | 'review';
  sourceId: string;
  timestamp: string;
  
  // Agency-related fields
  agencyId?: string;
  agencyName?: string;
  location?: string;
  rating?: number;
  specialties?: string[];
  
  // Conversation-related fields
  conversationId?: string;
  userId?: string;
  messageIndex?: number;
  role?: 'user' | 'assistant' | 'system';
  
  // Analysis-related fields
  analysisType?: string;
  searchContext?: {
    location: string;
    query: string;
    searchHistoryId?: string;
  };
  
  // Additional flexible fields
  [key: string]: any;
}

export interface Document {
  id: number;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface HybridSearchResult extends Document {
  similarity: number;
  rank_score: number;
}

export interface ConversationSummary {
  conversation_id: string;
  message_count: number;
  last_message_at: string;
  first_message_at: string;
}

export interface ConversationMessage {
  id: number;
  content: string;
  role: string;
  message_index: number;
  created_at: string;
}

// Search result metadata to store in SearchHistory.resultsJson
export interface SearchResultMetadata {
  searchResults?: any[];
  conversationId?: string;
  documentsCreated?: number;
  searchType?: 'simple' | 'with_chat' | 'chat_continuation';
  timestamp?: string;
  placeId?: string;
  placeDetails?: {
    description: string;
    mainText: string;
    secondaryText: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  messageCount?: number;
  lastMessageAt?: string;
}