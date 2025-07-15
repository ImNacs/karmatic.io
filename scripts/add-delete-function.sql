-- Agregar función delete_search_history si no existe
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