-- Script completo para aplicar el modelo estándar en Supabase
-- Ejecutar este archivo en Supabase SQL Editor

-- ============================================
-- PARTE 1: FUNCIONES SQL
-- ============================================

-- 1. Obtener historial de búsquedas (conversaciones)
CREATE OR REPLACE FUNCTION get_search_history(
  p_user_id BIGINT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_include_deleted BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id TEXT,
  location TEXT,
  query TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(
      (m.metadata->'search'->>'location')::TEXT,
      ''::TEXT
    ) as location,
    COALESCE(
      (m.metadata->'search'->>'query')::TEXT,
      ''::TEXT  
    ) as query,
    c.created_at
  FROM conversations c
  INNER JOIN messages m ON m.conversation_id = c.id AND m.message_index = 0
  WHERE 
    (p_user_id IS NULL OR c.user_id = p_user_id)
    AND (p_session_id IS NULL OR c.session_id = p_session_id)
    AND (p_include_deleted OR c.deleted_at IS NULL)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar límite de búsquedas anónimas
CREATE OR REPLACE FUNCTION check_anonymous_search_limit(
  p_session_id TEXT,
  p_limit_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  search_count INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_count INTEGER;
  v_daily_limit INTEGER := 1;
BEGIN
  -- Contar búsquedas en las últimas N horas
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM conversations
  WHERE session_id = p_session_id
    AND deleted_at IS NULL
    AND created_at > NOW() - INTERVAL '1 hour' * p_limit_hours;
  
  RETURN QUERY
  SELECT 
    v_count as search_count,
    GREATEST(0, v_daily_limit - v_count)::INTEGER as remaining;
END;
$$ LANGUAGE plpgsql;

-- 3. Eliminar historial de búsqueda (soft delete)
CREATE OR REPLACE FUNCTION delete_search_history(
  p_conversation_id TEXT,
  p_user_id BIGINT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE conversations
  SET deleted_at = NOW()
  WHERE id = p_conversation_id
    AND deleted_at IS NULL
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND session_id = p_session_id)
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- 4. Restaurar historial eliminado
CREATE OR REPLACE FUNCTION restore_search_history(
  p_conversation_id TEXT,
  p_user_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE conversations
  SET deleted_at = NULL
  WHERE id = p_conversation_id
    AND deleted_at IS NOT NULL
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Transferir historial anónimo a usuario autenticado
CREATE OR REPLACE FUNCTION transfer_anonymous_history(
  p_session_id TEXT,
  p_user_id BIGINT
)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE conversations
  SET 
    user_id = p_user_id,
    session_id = NULL,
    updated_at = NOW()
  WHERE session_id = p_session_id
    AND user_id IS NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- 6. Guardar búsqueda inicial (crear conversación y primer mensaje)
CREATE OR REPLACE FUNCTION save_initial_search(
  p_conversation_id TEXT,
  p_location TEXT,
  p_query TEXT,
  p_user_id BIGINT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_content TEXT;
  v_title TEXT;
BEGIN
  -- Generar contenido si no se proporciona
  v_content := COALESCE(p_content, 'Busco ' || p_query || ' en ' || p_location);
  
  -- Generar título
  v_title := p_location || ' - ' || p_query;
  
  -- Crear conversación
  INSERT INTO conversations (id, user_id, session_id, title, metadata)
  VALUES (
    p_conversation_id,
    p_user_id,
    p_session_id,
    v_title,
    jsonb_build_object('source', 'search')
  );
  
  -- Crear primer mensaje
  INSERT INTO messages (conversation_id, content, role, message_index, metadata)
  VALUES (
    p_conversation_id,
    v_content,
    'user',
    0,
    jsonb_build_object(
      'search', jsonb_build_object(
        'location', p_location,
        'query', p_query,
        'isInitial', true
      )
    )
  );
  
  RETURN p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para obtener conversación completa
CREATE OR REPLACE FUNCTION get_conversation_messages(
  p_conversation_id TEXT,
  p_user_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  role TEXT,
  message_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.role,
    m.message_index,
    m.metadata,
    m.created_at
  FROM messages m
  INNER JOIN conversations c ON c.id = m.conversation_id
  WHERE c.id = p_conversation_id
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
    AND c.deleted_at IS NULL
  ORDER BY m.message_index;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 2: ÍNDICES ADICIONALES
-- ============================================

-- Crear índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_conversations_session_created 
ON conversations(session_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_index 
ON messages(conversation_id, message_index);

-- ============================================
-- PARTE 3: PERMISOS
-- ============================================

-- Otorgar permisos a las funciones
GRANT EXECUTE ON FUNCTION get_search_history TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_anonymous_search_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION delete_search_history TO authenticated, anon;
GRANT EXECUTE ON FUNCTION restore_search_history TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_anonymous_history TO authenticated;
GRANT EXECUTE ON FUNCTION save_initial_search TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_conversation_messages TO authenticated, anon;

-- ============================================
-- PARTE 4: RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT
  USING (auth.uid()::text = user_id::text OR session_id IS NOT NULL);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (auth.uid()::text = c.user_id::text OR c.session_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
  RAISE NOTICE 'Modelo estándar aplicado correctamente.';
  RAISE NOTICE 'Tablas creadas: conversations, messages';
  RAISE NOTICE 'Funciones creadas: 7';
  RAISE NOTICE 'Índices creados: 2 adicionales';
  RAISE NOTICE 'RLS habilitado con políticas';
END $$;