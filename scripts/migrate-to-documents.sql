-- Migración: Unificar todo en la tabla documents
-- Este script agrega las funciones SQL necesarias para mantener la funcionalidad
-- sin cambiar el UI/UX

-- 1. Función para obtener historial de búsquedas (reemplaza SearchHistory)
CREATE OR REPLACE FUNCTION get_search_history(
  p_user_id text DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_include_deleted boolean DEFAULT false
)
RETURNS TABLE (
  id text,
  conversation_id text,
  location text,
  query text,
  created_at timestamp with time zone,
  deleted_at timestamp with time zone,
  message_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH first_messages AS (
    SELECT 
      d.id::text as doc_id,
      d.metadata->>'conversationId' as conv_id,
      d.metadata->'search'->>'location' as loc,
      d.metadata->'search'->>'query' as qry,
      d.created_at as created,
      (d.metadata->>'deletedAt')::timestamp with time zone as deleted,
      d.metadata
    FROM documents d
    WHERE 
      d.metadata->>'type' = 'conversation_message'
      AND d.metadata->>'messageIndex' = '0' -- Primera mensaje = búsqueda
      AND (
        (p_user_id IS NOT NULL AND d.metadata->>'userId' = p_user_id) OR
        (p_session_id IS NOT NULL AND d.metadata->>'sessionId' = p_session_id)
      )
      AND (p_include_deleted OR d.metadata->>'deletedAt' IS NULL)
  ),
  message_counts AS (
    SELECT 
      metadata->>'conversationId' as conv_id,
      COUNT(*) as msg_count
    FROM documents
    WHERE metadata->>'type' = 'conversation_message'
    GROUP BY metadata->>'conversationId'
  )
  SELECT 
    fm.conv_id as id, -- Usar conversationId como ID para compatibilidad
    fm.conv_id as conversation_id,
    fm.loc as location,
    fm.qry as query,
    fm.created as created_at,
    fm.deleted as deleted_at,
    COALESCE(mc.msg_count, 1) as message_count
  FROM first_messages fm
  LEFT JOIN message_counts mc ON fm.conv_id = mc.conv_id
  ORDER BY fm.created DESC;
END;
$$;

-- 2. Función para rate limiting de usuarios anónimos (reemplaza AnonymousSearch)
CREATE OR REPLACE FUNCTION check_anonymous_search_limit(
  p_session_id text,
  p_limit_hours int DEFAULT 24
)
RETURNS TABLE (
  search_count int,
  remaining int,
  last_search_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_search_count int;
  v_last_search timestamp with time zone;
BEGIN
  -- Contar búsquedas en las últimas X horas
  SELECT 
    COUNT(DISTINCT metadata->>'conversationId'),
    MAX(created_at)
  INTO v_search_count, v_last_search
  FROM documents
  WHERE 
    metadata->>'sessionId' = p_session_id
    AND metadata->>'messageIndex' = '0' -- Primera mensaje = búsqueda
    AND metadata->'search'->>'isInitial' = 'true'
    AND created_at > NOW() - INTERVAL '1 hour' * p_limit_hours;
  
  RETURN QUERY
  SELECT 
    COALESCE(v_search_count, 0) as search_count,
    GREATEST(0, 1 - COALESCE(v_search_count, 0)) as remaining,
    v_last_search as last_search_at;
END;
$$;

-- 3. Función para marcar búsqueda como eliminada (soft delete)
CREATE OR REPLACE FUNCTION delete_search_history(
  p_conversation_id text,
  p_user_id text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  -- Actualizar todos los mensajes de la conversación
  UPDATE documents
  SET metadata = jsonb_set(
    metadata,
    '{deletedAt}',
    to_jsonb(NOW())
  )
  WHERE 
    metadata->>'conversationId' = p_conversation_id
    AND metadata->>'type' = 'conversation_message'
    AND (
      (p_user_id IS NOT NULL AND metadata->>'userId' = p_user_id) OR
      (p_session_id IS NOT NULL AND metadata->>'sessionId' = p_session_id)
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated > 0;
END;
$$;

-- 4. Función para restaurar búsqueda eliminada
CREATE OR REPLACE FUNCTION restore_search_history(
  p_conversation_id text,
  p_user_id text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  -- Quitar deletedAt de todos los mensajes
  UPDATE documents
  SET metadata = metadata - 'deletedAt'
  WHERE 
    metadata->>'conversationId' = p_conversation_id
    AND metadata->>'type' = 'conversation_message'
    AND metadata->>'deletedAt' IS NOT NULL
    AND (
      (p_user_id IS NOT NULL AND metadata->>'userId' = p_user_id) OR
      (p_session_id IS NOT NULL AND metadata->>'sessionId' = p_session_id)
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated > 0;
END;
$$;

-- 5. Función para transferir historial anónimo a usuario autenticado
CREATE OR REPLACE FUNCTION transfer_anonymous_history(
  p_session_id text,
  p_user_id text
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  -- Actualizar userId en todos los documentos con ese sessionId
  UPDATE documents
  SET metadata = jsonb_set(
    jsonb_set(metadata, '{userId}', to_jsonb(p_user_id)),
    '{sessionId}',
    'null'::jsonb
  )
  WHERE 
    metadata->>'sessionId' = p_session_id
    AND metadata->>'type' = 'conversation_message';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated;
END;
$$;

-- 6. Función helper para guardar búsqueda inicial
CREATE OR REPLACE FUNCTION save_initial_search(
  p_conversation_id text,
  p_location text,
  p_query text,
  p_user_id text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_id bigint;
BEGIN
  INSERT INTO documents (content, metadata)
  VALUES (
    COALESCE(p_query, '') || ' en ' || p_location,
    jsonb_build_object(
      'type', 'conversation_message',
      'conversationId', p_conversation_id,
      'userId', p_user_id,
      'sessionId', p_session_id,
      'role', 'user',
      'messageIndex', 0,
      'search', jsonb_build_object(
        'location', p_location,
        'query', p_query,
        'isInitial', true
      )
    )
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 7. Índices adicionales para optimizar queries
CREATE INDEX IF NOT EXISTS idx_documents_conversation_id 
ON documents ((metadata->>'conversationId'));

CREATE INDEX IF NOT EXISTS idx_documents_user_session 
ON documents ((metadata->>'userId'), (metadata->>'sessionId'));

CREATE INDEX IF NOT EXISTS idx_documents_message_index 
ON documents ((metadata->>'messageIndex'));

CREATE INDEX IF NOT EXISTS idx_documents_deleted_at 
ON documents ((metadata->>'deletedAt')) 
WHERE metadata->>'deletedAt' IS NOT NULL;

-- 8. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_search_history TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_anonymous_search_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION delete_search_history TO authenticated, anon;
GRANT EXECUTE ON FUNCTION restore_search_history TO authenticated, anon;
GRANT EXECUTE ON FUNCTION transfer_anonymous_history TO authenticated;
GRANT EXECUTE ON FUNCTION save_initial_search TO authenticated, anon;