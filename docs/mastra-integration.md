# 🔗 Integración Mastra con UI

## Resumen

La integración entre el UI de chat y Mastra está completamente configurada y funcional. El chat utiliza streaming de respuestas para una experiencia de usuario fluida.

## Arquitectura

```
UI (ChatPanel) → AIAssistantContext → /api/ai/chat → Mastra Agent → OpenRouter
```

## Componentes Principales

### 1. Frontend - Chat UI
- **`ChatPanel.tsx`**: Interfaz de usuario del chat con soporte para streaming
- **`AIAssistantContext.tsx`**: Context que maneja el estado del chat y las llamadas API
- **`AIAssistant.tsx`**: Componente principal que renderiza el panel de chat

### 2. Backend - API Endpoints
- **`/api/ai/chat`**: Endpoint principal que usa Mastra con el agente básico
- **`/api/ai/chat-sdk`**: Endpoint alternativo usando directamente el AI SDK

### 3. Mastra Configuration
- **`src/mastra/index.ts`**: Configuración principal de Mastra
- **`src/mastra/agents/basic.ts`**: Agente básico configurado con OpenRouter

## Flujo de Datos

1. El usuario escribe un mensaje en `ChatPanel`
2. `AIAssistantContext.sendMessage()` envía el mensaje a `/api/ai/chat`
3. El endpoint obtiene el agente de Mastra y llama a `agent.stream()`
4. La respuesta se envía como Server-Sent Events
5. El contexto procesa los chunks y actualiza el UI en tiempo real

## Formato de Streaming

El formato de streaming es compatible entre Mastra y el AI SDK:

```javascript
// Formato esperado por AIAssistantContext
data: {"delta":{"content":"Hola"}}
data: {"delta":{"content":", "}}
data: {"delta":{"content":"¿cómo"}}
data: [DONE]
```

## Configuración de Memoria

El chat mantiene conversaciones aisladas por búsqueda:
- Cada búsqueda tiene su propio thread de conversación
- Los mensajes se persisten en `sessionStorage`
- El contexto se pasa automáticamente al agente

## Pruebas

Para probar la integración:

```bash
# Ejecutar el script de prueba
node scripts/test-mastra-chat.js

# O usar curl directamente
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola"}]}'
```

## Variables de Entorno

```env
# API Key de OpenRouter (requerido)
OPENROUTER_API_KEY=tu-api-key-aqui

# Modelo AI (opcional, por defecto: moonshotai/kimi-k2)
AI_MODEL=moonshotai/kimi-k2
```

## Personalización

### Cambiar el Modelo

Método 1: Variable de entorno (recomendado)
```env
# En tu archivo .env
AI_MODEL=anthropic/claude-3-5-sonnet
```

Método 2: Directamente en el código
```typescript
// src/mastra/agents/basic.ts
const selectedModel = "anthropic/claude-3-5-sonnet";
```

Modelos disponibles:
- `moonshotai/kimi-k2` - Mejor para tareas agénticas (default)
- `anthropic/claude-3-5-sonnet` - Mejor conversación general
- `openai/gpt-4-turbo-preview` - Modelo versátil
- Ver más en [docs/kimi-k2-configuration.md](./kimi-k2-configuration.md)

### Agregar Herramientas

```typescript
import { createTool } from "@mastra/core";

const searchTool = createTool({
  id: "search",
  description: "Buscar información",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ context }) => {
    // Implementación
  },
});

// Agregar al agente
tools: {
  search: searchTool,
}
```

## Solución de Problemas

1. **Error de API Key**: Verifica que `OPENROUTER_API_KEY` esté configurada
2. **No hay streaming**: Asegúrate de que el endpoint devuelva `toDataStreamResponse()`
3. **Mensajes no se muestran**: Revisa la consola del navegador para errores
4. **Error "fs module" en Edge Runtime**: El endpoint usa `runtime = 'nodejs'` porque Mastra requiere acceso al sistema de archivos

---

**Última actualización**: Julio 2025