# 📚 Sistema de Citations estilo Perplexity para Karmatic

## 🎯 Objetivo
Implementar un sistema de fuentes/citations en el chat de Karmatic similar a Perplexity AI, que muestre de dónde proviene cada información con referencias inline [1][2] y un panel de fuentes verificables.

## 🔍 Análisis Previo

### Arquitectura de Perplexity
- **Inline Citations**: Marcadores numéricos [1][2] dentro del texto
- **RAG Mejorado**: Restricción estricta a información de fuentes recuperadas
- **API Structure**: Campo `citations` con metadata (título, URL, fecha)
- **Formato JSON**:
```json
{
  "content": "El Honda CR-V está disponible[1]...",
  "citations": [
    {
      "index": 1,
      "title": "Inventario Honda",
      "url": "https://example.com",
      "date": "2025-01-14"
    }
  ]
}
```

### Estado Actual de Mastra
- ❌ No tiene soporte nativo para citations
- ❌ Las herramientas no devuelven metadata de fuentes
- ❌ El agente no tiene instrucciones para citar
- ✅ Soporta respuestas estructuradas con schemas
- ✅ Permite modificar el comportamiento mediante instrucciones

## 🏗️ Arquitectura Propuesta

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (UI)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   ChatPanel  │  │ CitationLinks│  │ SourcesPanel     │  │
│  │ [1][2] refs  │  │ Inline marks │  │ Expandable list  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (/api/ai/chat)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │CitationParser│ │StreamProcessor│  │SourceFormatter  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Mastra Agent                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │Instructions │  │Tools w/Sources│  │Output Parser    │  │
│  │for citations│  │    Metadata   │  │Extract refs     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Formato de Datos

```typescript
interface StreamChunk {
  type: 'content' | 'citation' | 'source';
  data: {
    // Para content
    text?: string;
    citationRefs?: number[]; // Referencias a citas en este chunk
    
    // Para citation
    index?: number;
    sourceId?: string;
    
    // Para source
    source?: {
      id: string;
      title: string;
      url?: string;
      type: 'dealership' | 'inventory' | 'market' | 'web';
      timestamp?: string;
      metadata?: Record<string, any>;
    };
  };
}
```

## 💻 Implementación

### Fase 1: Backend - Herramientas con Sources

```typescript
// Ejemplo: tool de búsqueda actualizada
const searchDealershipsWithSources = createTool({
  id: "search_dealerships",
  description: "Search for car dealerships",
  inputSchema: z.object({
    query: z.string(),
    location: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { query, location } = context;
    const results = await searchDealerships(query, location);
    
    return {
      dealerships: results.data,
      _sources: [
        {
          id: crypto.randomUUID(),
          title: `Búsqueda de concesionarios: "${query}"`,
          url: `https://karmatic.io/search?q=${encodeURIComponent(query)}`,
          type: 'dealership',
          timestamp: new Date().toISOString(),
          metadata: {
            resultsCount: results.data.length,
            location: location || 'México',
          }
        }
      ]
    };
  },
});
```

### Fase 2: Agent Instructions

```typescript
const citationAgent = new Agent({
  name: "Karmatic Assistant",
  description: "AI assistant for car shopping with source citations",
  instructions: `You are Karmatic's car shopping assistant. 

CITATION RULES:
1. When using information from tools, ALWAYS cite your sources using [1], [2], etc.
2. Place citations immediately after the relevant information
3. If combining multiple sources, use multiple citations [1][2]
4. Number citations sequentially starting from 1 in each response

CITATION FORMAT EXAMPLES:
- "The Honda CR-V is available at 3 dealerships near you[1]."
- "According to market data[2], prices have decreased 5% this month[3]."
- "AutoMax Honda[1] has the best selection with 15 CR-Vs in stock[4]."

IMPORTANT: Never make up information. Only cite actual tool responses.`,
  model: openrouter(selectedModel),
  tools: {
    searchDealerships: searchDealershipsWithSources,
    getVehicleInventory: getVehicleInventoryWithSources,
    // ... más tools con sources
  },
});
```

### Fase 3: Stream Processing

```typescript
// En /api/ai/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const stream = await agent.stream(messages);
  
  // Custom transform stream para extraer citations
  const citationStream = new TransformStream({
    transform(chunk, controller) {
      // Detectar patrones [1], [2], etc.
      const citationPattern = /\[(\d+)\]/g;
      let match;
      
      while ((match = citationPattern.exec(chunk)) !== null) {
        controller.enqueue({
          type: 'citation',
          data: { index: parseInt(match[1]) }
        });
      }
      
      // Enviar el chunk de contenido
      controller.enqueue({
        type: 'content',
        data: { text: chunk }
      });
    }
  });
  
  return new Response(
    stream.pipeThrough(citationStream),
    { headers: { 'Content-Type': 'text/event-stream' } }
  );
}
```

### Fase 4: UI Components

```typescript
// components/chat/CitationText.tsx
export function CitationText({ text, citations }: Props) {
  // Reemplazar [1] con elementos clickables
  const renderWithCitations = (text: string) => {
    return text.split(/(\[\d+\])/g).map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        return (
          <Citation 
            key={i} 
            index={index} 
            onClick={() => scrollToSource(index)}
          />
        );
      }
      return part;
    });
  };
  
  return <span>{renderWithCitations(text)}</span>;
}

// components/chat/SourcesPanel.tsx
export function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-2">Fuentes</h4>
      {sources.map((source, i) => (
        <SourceItem 
          key={source.id}
          index={i + 1}
          source={source}
        />
      ))}
    </div>
  );
}
```

## 🎨 Diseño Visual

### Ejemplo de UI Final

```
┌─────────────────────────────────────────────────────────────┐
│ Assistant                                                    │
├─────────────────────────────────────────────────────────────┤
│ He encontrado 3 concesionarios Honda cerca de ti[1].       │
│ AutoMax Honda tiene la mejor selección con 15 CR-Vs en     │
│ inventario[2], mientras que Honda Centro ofrece mejores    │
│ precios con descuentos de hasta 10%[3]. Según datos del    │
│ mercado[4], este es un buen momento para comprar.          │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📚 Fuentes                                    [▼]   │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ [1] Búsqueda de concesionarios Honda               │   │
│ │     Ciudad de México • hace 2s                      │   │
│ │                                                     │   │
│ │ [2] Inventario AutoMax Honda                       │   │
│ │     15 vehículos disponibles • hace 3s             │   │
│ │                                                     │   │
│ │ [3] Promociones Honda Centro                       │   │
│ │     Descuentos enero 2025 • hace 3s                │   │
│ │                                                     │   │
│ │ [4] Análisis de mercado automotriz                 │   │
│ │     Tendencias enero 2025 • hace 4s                │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Interacciones
- **Hover** en [1] → Resalta la fuente correspondiente
- **Click** en [1] → Scroll y expand a la fuente
- **Click** en fuente → Abre URL si está disponible
- Panel de fuentes colapsable/expandible

## 📋 Lista de Herramientas a Actualizar

1. `search-dealerships.ts` - Búsqueda de concesionarios
2. `get-vehicle-inventory.ts` - Inventario de vehículos
3. `compare-vehicles.ts` - Comparación de modelos
4. `get-market-insights.ts` - Análisis de mercado
5. `analyze-dealership.ts` - Análisis de concesionario
6. `generate-recommendations.ts` - Recomendaciones personalizadas
7. `get-search-history.ts` - Historial de búsquedas
8. `save-user-preference.ts` - Guardar preferencias

## 🚀 Plan de Implementación

### Timeline Estimado
- **Fase 1 - Backend** (1-2 días)
  - [ ] Actualizar todas las herramientas con `_sources`
  - [ ] Modificar instrucciones del agente
  - [ ] Implementar citation parser en streaming

- **Fase 2 - Frontend** (1-2 días)
  - [ ] Componente CitationText
  - [ ] Panel de fuentes (SourcesPanel)
  - [ ] Integración con AIAssistantContext

- **Fase 3 - Testing & Polish** (1 día)
  - [ ] Verificar todas las herramientas
  - [ ] Mejorar estilos y animaciones
  - [ ] Documentar para desarrolladores

## 📊 Métricas de Éxito

- ✅ 100% de respuestas con herramientas incluyen citations
- ✅ Citations correctamente numeradas y formateadas
- ✅ Panel de fuentes muestra información relevante
- ✅ Enlaces a fuentes funcionan cuando están disponibles
- ✅ Usuarios reportan mayor confianza en respuestas

## 🔗 Referencias

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Mastra Documentation](https://mastra.ai/docs)
- [Análisis técnico de Perplexity](./perplexity-citation-analysis.md)

---

**Estado**: 🟡 Pendiente de implementación  
**Prioridad**: Alta  
**Última actualización**: Enero 14, 2025