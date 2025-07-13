# 🧠 Memory Management para Agentes

Este directorio contiene la configuración de memoria persistente para los agentes AI.

## 📋 ¿Qué es Memory en Mastra?

La memoria permite a los agentes:
- Recordar conversaciones anteriores
- Mantener contexto entre sesiones
- Personalizar respuestas basadas en interacciones previas
- Implementar aprendizaje a largo plazo

## 🏗️ Arquitectura de Memoria

```
┌─────────────────┐
│   Agent Query   │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Memory  │
    │ Manager │
    └────┬────┘
         │
    ┌────▼─────────────┐
    │ Context Retrieval│
    └────┬─────────────┘
         │
┌────────▼────────┬──────────────┐
│ Short-term      │ Long-term    │
│ (Session)       │ (Persistent) │
└─────────────────┴──────────────┘
         │
    ┌────▼────┐
    │Supabase │
    │pgvector │
    └─────────┘
```

## 🛠️ Configuración Planeada

### 1. **Basic Memory Store**

```typescript
import { Memory } from "@mastra/memory";
import { PostgreSQLStore } from "@mastra/memory/stores";

/**
 * Configuración básica de memoria usando Supabase
 */
export const basicMemory = new Memory({
  storage: new PostgreSQLStore({
    connectionString: process.env.DATABASE_URL,
    tableName: "agent_memories"
  }),
  options: {
    maxMessages: 50,          // Máximo de mensajes a recordar
    ttl: 7 * 24 * 60 * 60,   // 7 días en segundos
    semanticRecall: false     // Sin búsqueda semántica (por ahora)
  }
});
```

### 2. **Advanced Memory con Vector Search**

```typescript
import { Memory } from "@mastra/memory";
import { PgVectorStore } from "@mastra/memory/stores";
import { openai } from "@ai-sdk/openai";

/**
 * Memoria avanzada con búsqueda semántica usando pgvector
 */
export const advancedMemory = new Memory({
  storage: new PgVectorStore({
    connectionString: process.env.DATABASE_URL,
    tableName: "agent_vector_memories",
    embeddingDimensions: 1536, // OpenAI embeddings
    embeddingModel: openai.embedding("text-embedding-3-small")
  }),
  options: {
    maxMessages: 100,
    semanticRecall: true,
    similarityThreshold: 0.7,
    contextWindow: 10 // Mensajes de contexto a incluir
  }
});
```

### 3. **User-Specific Memory**

```typescript
/**
 * Factory para crear memoria específica por usuario
 */
export function createUserMemory(userId: string) {
  return new Memory({
    storage: new PostgreSQLStore({
      connectionString: process.env.DATABASE_URL,
      tableName: "user_agent_memories",
      partitionKey: userId // Particionar por usuario
    }),
    options: {
      maxMessages: 200,
      ttl: 30 * 24 * 60 * 60, // 30 días
      filters: {
        userId,
        active: true
      }
    }
  });
}
```

## 📊 Schema de Base de Datos

### Tabla básica de memoria

```sql
-- Crear tabla para memoria de agentes
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'user' o 'assistant'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Índices para performance
  INDEX idx_thread_user (thread_id, user_id),
  INDEX idx_created_at (created_at DESC)
);
```

### Tabla con vectores

```sql
-- Extensión requerida
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla con embeddings
CREATE TABLE agent_vector_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- Dimensiones de OpenAI
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índice para búsqueda de similitud
  INDEX idx_embedding USING hnsw (embedding vector_cosine_ops)
);
```

## 🎯 Casos de Uso

### 1. **Conversación Continua**
```typescript
// El agente recuerda conversaciones anteriores
const agent = new Agent({
  name: "Karmatic Assistant",
  memory: basicMemory,
  // ...
});

// Automáticamente incluye contexto previo
const response = await agent.generate("¿Qué hablamos ayer?", {
  threadId: "user-123-thread-456",
  resourceId: "user-123"
});
```

### 2. **Búsqueda Semántica**
```typescript
// Buscar memorias relevantes
const relevantMemories = await advancedMemory.search({
  query: "agencias Honda en Miami",
  limit: 5,
  threadId: "user-123-thread-456"
});
```

### 3. **Personalización**
```typescript
// Memoria que aprende preferencias
const userPreferences = await memory.getMetadata({
  userId: "user-123",
  key: "preferences"
});

// Usar en respuestas
if (userPreferences.preferredBrands?.includes("Toyota")) {
  // Priorizar resultados de Toyota
}
```

## 📋 Estrategias de Memoria

### Short-term (Sesión actual)
- Últimos 10-20 mensajes
- Contexto inmediato
- Sin persistencia

### Long-term (Persistente)
- Historial completo
- Preferencias de usuario
- Patrones de búsqueda

### Episodic (Por evento)
- Búsquedas específicas
- Comparaciones realizadas
- Decisiones tomadas

## 🔧 Configuración en Agentes

```typescript
import { karmaticAssistant } from "../agents/karmatic-assistant";
import { advancedMemory } from "../memory/advanced-memory";

// Asignar memoria al agente
const agentWithMemory = {
  ...karmaticAssistant,
  memory: advancedMemory
};

// O en la definición del agente
export const karmaticAssistant = new Agent({
  name: "Karmatic Assistant",
  memory: advancedMemory,
  // ... resto de config
});
```

## 🚀 Mejores Prácticas

1. **Limpieza de Datos**: Implementar TTL para evitar crecimiento infinito
2. **Privacidad**: Nunca almacenar información sensible
3. **Performance**: Usar índices apropiados en PostgreSQL
4. **Costos**: Monitorear uso de embeddings (costo por token)
5. **Backup**: Implementar estrategia de respaldo

## 📚 Recursos

- [Mastra Memory Documentation](https://mastra.ai/docs/memory)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Embeddings](https://supabase.com/docs/guides/ai/vector-embeddings)

---

**Última actualización**: Julio 2025