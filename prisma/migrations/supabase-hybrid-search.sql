-- Supabase Hybrid Search Schema for Karmatic
-- This migration should be run in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Create or modify documents table for hybrid search
DO $$ 
BEGIN
  -- Check if documents table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    -- Add fts column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'fts') THEN
      ALTER TABLE documents 
      ADD COLUMN fts tsvector 
      GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED;
    END IF;
    
    -- Add timestamps if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'created_at') THEN
      ALTER TABLE documents 
      ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'updated_at') THEN
      ALTER TABLE documents 
      ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
  ELSE
    -- Create new table with all required fields
    CREATE TABLE documents (
      id bigserial PRIMARY KEY,
      content text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}',
      embedding vector(1536),
      fts tsvector GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS documents_fts_idx ON documents USING gin(fts);
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS documents_metadata_idx ON documents USING gin(metadata);

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS documents_metadata_type_idx ON documents ((metadata->>'type'));
CREATE INDEX IF NOT EXISTS documents_metadata_conversation_idx ON documents ((metadata->>'conversationId'));
CREATE INDEX IF NOT EXISTS documents_metadata_user_idx ON documents ((metadata->>'userId'));
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);

-- Create hybrid search function with RRF (Reciprocal Rank Fusion)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  full_text_weight float DEFAULT 1,
  semantic_weight float DEFAULT 1,
  rrf_k int DEFAULT 50,
  filter_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float,
  rank_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH full_text AS (
    SELECT 
      d.id,
      d.content,
      d.metadata,
      ts_rank_cd(d.fts, websearch_to_tsquery('spanish', query_text)) as rank,
      row_number() OVER (ORDER BY ts_rank_cd(d.fts, websearch_to_tsquery('spanish', query_text)) DESC) as rn
    FROM documents d
    WHERE 
      d.fts @@ websearch_to_tsquery('spanish', query_text)
      AND d.metadata @> filter_metadata
    LIMIT match_count * 2
  ),
  semantic AS (
    SELECT 
      d.id,
      d.content,
      d.metadata,
      1 - (d.embedding <=> query_embedding) as similarity,
      row_number() OVER (ORDER BY d.embedding <=> query_embedding) as rn
    FROM documents d
    WHERE 
      d.metadata @> filter_metadata
      AND d.embedding IS NOT NULL
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  rrf_union AS (
    SELECT 
      COALESCE(ft.id, s.id) as id,
      COALESCE(ft.content, s.content) as content,
      COALESCE(ft.metadata, s.metadata) as metadata,
      COALESCE(s.similarity, 0) as similarity,
      COALESCE(1.0 / (rrf_k + ft.rn), 0) * full_text_weight +
      COALESCE(1.0 / (rrf_k + s.rn), 0) * semantic_weight as score
    FROM full_text ft
    FULL OUTER JOIN semantic s ON ft.id = s.id
  )
  SELECT 
    id,
    content,
    metadata,
    similarity,
    score as rank_score
  FROM rrf_union
  ORDER BY score DESC
  LIMIT match_count;
END;
$$;

-- Helper function to get conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(
  user_id text,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  conversation_id text,
  message_count bigint,
  last_message_at timestamp with time zone,
  first_message_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    metadata->>'conversationId' as conversation_id,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_at,
    MIN(created_at) as first_message_at
  FROM documents
  WHERE 
    metadata->>'type' = 'conversation_message'
    AND metadata->>'userId' = user_id
  GROUP BY metadata->>'conversationId'
  ORDER BY MAX(created_at) DESC
  LIMIT limit_count;
END;
$$;

-- Function to get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(
  conversation_id text,
  limit_count int DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  content text,
  role text,
  message_index int,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata->>'role' as role,
    (d.metadata->>'messageIndex')::int as message_index,
    d.created_at
  FROM documents d
  WHERE 
    d.metadata->>'type' = 'conversation_message'
    AND d.metadata->>'conversationId' = conversation_id
  ORDER BY (d.metadata->>'messageIndex')::int DESC
  LIMIT limit_count;
END;
$$;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at') THEN
    CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Grant permissions (adjust based on your Supabase auth setup)
GRANT SELECT, INSERT, UPDATE ON documents TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages TO authenticated;

-- Add RLS policies if needed
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own conversation messages
CREATE POLICY "Users can view own conversations" ON documents
  FOR SELECT
  USING (
    metadata->>'type' = 'conversation_message' 
    AND metadata->>'userId' = auth.uid()::text
  );

-- Policy for users to view public agency data
CREATE POLICY "Everyone can view agency data" ON documents
  FOR SELECT
  USING (
    metadata->>'type' IN ('agency', 'agency_analysis')
  );