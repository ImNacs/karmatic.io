-- Script de migración: Documents -> Conversations + Messages
-- Este script migra los datos existentes del modelo unificado al modelo estándar
-- Ejecutar DESPUÉS de aplicar el nuevo schema con prisma db push

-- 1. Crear conversaciones únicas desde documents
INSERT INTO conversations (id, user_id, session_id, title, metadata, created_at, updated_at)
SELECT DISTINCT ON (metadata->>'conversationId')
  metadata->>'conversationId' as id,
  CASE 
    WHEN metadata->>'userId' IS NOT NULL THEN (metadata->>'userId')::bigint
    ELSE NULL
  END as user_id,
  metadata->>'sessionId' as session_id,
  COALESCE(
    metadata->'search'->>'location' || ' - ' || metadata->'search'->>'query',
    'Conversación'
  ) as title,
  jsonb_build_object(
    'source', 'migrated_from_documents',
    'originalSearch', metadata->'search'
  ) as metadata,
  created_at,
  updated_at
FROM documents
WHERE metadata->>'type' = 'conversation_message'
  AND metadata->>'conversationId' IS NOT NULL
ORDER BY metadata->>'conversationId', created_at;

-- 2. Migrar mensajes desde documents
INSERT INTO messages (conversation_id, content, role, message_index, metadata, created_at)
SELECT
  metadata->>'conversationId' as conversation_id,
  content,
  COALESCE(metadata->>'role', 'user') as role,
  COALESCE((metadata->>'messageIndex')::int, 0) as message_index,
  jsonb_build_object(
    'search', metadata->'search',
    'sources', metadata->'sources',
    'migrated', true
  ) as metadata,
  created_at
FROM documents
WHERE metadata->>'type' = 'conversation_message'
  AND metadata->>'conversationId' IS NOT NULL
ORDER BY metadata->>'conversationId', (metadata->>'messageIndex')::int;

-- 3. Actualizar soft deletes
UPDATE conversations
SET deleted_at = NOW()
WHERE id IN (
  SELECT DISTINCT metadata->>'conversationId'
  FROM documents
  WHERE metadata->>'type' = 'conversation_message'
    AND metadata->>'deletedAt' IS NOT NULL
);

-- 4. Verificar migración
DO $$
DECLARE
  doc_count bigint;
  msg_count bigint;
  conv_count bigint;
BEGIN
  SELECT COUNT(*) INTO doc_count
  FROM documents
  WHERE metadata->>'type' = 'conversation_message';
  
  SELECT COUNT(*) INTO msg_count
  FROM messages;
  
  SELECT COUNT(*) INTO conv_count
  FROM conversations;
  
  RAISE NOTICE 'Migración completada:';
  RAISE NOTICE '- Documents originales: %', doc_count;
  RAISE NOTICE '- Messages migrados: %', msg_count;
  RAISE NOTICE '- Conversations creadas: %', conv_count;
  
  IF doc_count != msg_count THEN
    RAISE WARNING 'El número de documentos no coincide con los mensajes migrados!';
  END IF;
END $$;

-- 5. Opcional: Limpiar documents después de verificar que todo funciona
-- DELETE FROM documents WHERE metadata->>'type' = 'conversation_message';