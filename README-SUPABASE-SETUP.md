# Supabase Vector Store Setup for Karmatic

Este documento explica cómo configurar Supabase para el sistema RAG de Karmatic.

## 1. Ejecutar la Migración SQL

Copia y ejecuta el contenido de `prisma/migrations/supabase-hybrid-search.sql` en el editor SQL de Supabase:

```bash
# Archivo: prisma/migrations/supabase-hybrid-search.sql
```

Este script:
- Crea/modifica la tabla `documents` con soporte para hybrid search
- Agrega columna `fts` para búsqueda full-text en español
- Crea índices optimizados
- Instala funciones helper para búsquedas y conversaciones
- Configura RLS (Row Level Security)

## 2. Variables de Entorno

Agrega estas variables a tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## 3. Estructura de Metadata

El campo `metadata` en la tabla `documents` soporta diferentes tipos:

### Para Agencias
```json
{
  "type": "agency",
  "agencyId": "place_123",
  "agencyName": "Seguros México",
  "location": "CDMX",
  "rating": 4.5,
  "specialties": ["auto", "vida"]
}
```

### Para Conversaciones
```json
{
  "type": "conversation_message",
  "conversationId": "conv_uuid_123",
  "userId": "user_456",
  "messageIndex": 1,
  "role": "user",
  "searchContext": {
    "location": "CDMX",
    "query": "seguro auto"
  }
}
```

### Para Análisis
```json
{
  "type": "agency_analysis",
  "agencyId": "place_123",
  "analysisType": "reviews_summary",
  "searchContext": {
    "location": "CDMX",
    "query": "mejor seguro"
  }
}
```

## 4. Integración con n8n

n8n debe configurarse para:

1. **Crear documentos** con la estructura de metadata correcta
2. **Generar embeddings** usando OpenAI (1536 dimensiones)
3. **Llamar a hybrid_search** para búsquedas RAG
4. **Actualizar SearchHistory.resultsJson** con el conversationId

## 5. Funciones Disponibles

### hybrid_search
Búsqueda combinada semántica + full-text con RRF
```sql
SELECT * FROM hybrid_search(
  'seguros auto CDMX',           -- query_text
  '[0.1, 0.2, ...]'::vector,     -- query_embedding
  10,                            -- match_count
  1,                             -- full_text_weight
  1,                             -- semantic_weight
  50,                            -- rrf_k
  '{"location": "CDMX"}'::jsonb  -- filter_metadata
);
```

### get_user_conversations
Lista las conversaciones de un usuario
```sql
SELECT * FROM get_user_conversations('user_123', 20);
```

### get_conversation_messages
Obtiene mensajes de una conversación
```sql
SELECT * FROM get_conversation_messages('conv_uuid_123', 50);
```

## 6. Uso desde Next.js

```typescript
import { hybridSearch, getUserConversations } from '@/lib/supabase-vector';

// Buscar documentos
const results = await hybridSearch({
  queryText: 'seguros auto',
  filterMetadata: { location: 'CDMX' }
});

// Listar conversaciones
const conversations = await getUserConversations(userId);
```

## 7. Verificación

Para verificar que todo funciona:

1. Revisa que la tabla `documents` tenga la columna `fts`
2. Verifica que las funciones existan
3. Prueba una búsqueda simple

```sql
-- Verificar estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents';

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%search%';
```