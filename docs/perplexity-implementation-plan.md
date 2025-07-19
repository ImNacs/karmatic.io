# 🚀 Plan de Implementación: Sistema Anti-Fraude Automotriz tipo Perplexity

## 📊 Resumen Ejecutivo

**Objetivo**: Plataforma conversacional anti-fraude para análisis de agencias automotrices en México, con metodología Perplexity de respuestas citadas y verificables.

**Stack Confirmado**:
- **Backend**: Next.js 15.3.5 + React 19 + Mastra.ai v0.10.14 (agente conversacional) + Supabase (pgvector)
- **LLMs**: OpenRouter + AI SDK (multi-modelo: GPT-4o, Claude, Llama, Mistral, Cohere, **Kimi K2**)
- **Scraping**: Apify Actors + Perplexity para descubrimiento
- **Cache**: Redis/Upstash
- **Análisis**: 2-Fases (15 reseñas validación → análisis profundo si >70% confianza)
- **Query Parser**: Sistema básico regex + fallback para queries complejos

**Cobertura**: Todo México  
**Prioridad**: Mobile-first + Profundidad de análisis  
**Diferenciador**: "No solo te decimos dónde comprar, te protegemos de dónde NO comprar"

## 🏗️ Arquitectura Multi-Agente Escalable

### Estado Actual (Monolítico)
```
Flujo: Form → /api/analyze → Save → /explorer/[searchId] → Chat
```

**Problemas identificados**:
- Pipeline monolítico en `/api/analyze`
- No hay agentes Mastra configurados (solo MCP server)
- Chat API busca agente "basic" inexistente
- Sin sistema de citations
- Difícil mantener, extender y testear
- Query parser extrae info pero no se usa en búsqueda

### Arquitectura Multi-Agente Propuesta

```typescript
// Estructura modular escalable
mastra/
├── agents/
│   ├── orchestrator/        # Agente principal que coordina
│   ├── search/             # Búsqueda de agencias
│   ├── validator/          # Validación automotriz  
│   ├── analyzer/           # Análisis de confianza
│   ├── enricher/           # Enriquecimiento contextual
│   └── chat/              # Agente conversacional
├── tools/
│   ├── google-places/      # Herramienta Google Places
│   ├── reviews/           # Herramienta Apify Reviews
│   ├── trust-scoring/     # Herramienta Trust Analysis
│   ├── deep-analysis/     # Herramienta Perplexity
│   └── citations/         # Sistema de citations
└── workflows/
    ├── agency-analysis/    # Workflow principal
    └── conversation/       # Workflow de chat
```

### Agentes Especializados

```typescript
// 1. ORCHESTRATOR AGENT - Coordina todo el flujo
interface OrchestratorAgent {
  // Analiza intent y coordina sub-agentes según contexto
  async analyze(input: {
    query: string;
    location: Location;
    context?: ConversationContext;
  }): Promise<{
    queryIntent?: QueryIntent; // Análisis de intención
    agencies: AnalysisResult[];
    _sources?: Citation[]; // Referencias externas
  }>
}

// 2. SEARCH AGENT - Especializado en búsqueda
interface SearchAgent {
  tools: ['google-places'];
  
  async findAgencies(params: {
    query: string;
    location: Location;
    radius?: number;
  }): Promise<{
    agencies: Agency[];
    _sources?: Citation[]; // Google Places URL general
  }>
}

// 3. VALIDATOR AGENT - Valida si son automotrices
interface ValidatorAgent {
  tools: ['reviews', 'enhanced-validator'];
  
  async validateAgencies(agencies: Agency[]): Promise<{
    valid: ValidatedAgency[];
    excluded: ExcludedBusiness[];
  }>
}

// 4. ANALYZER AGENT - Análisis de confianza
interface AnalyzerAgent {
  tools: ['reviews', 'trust-scoring'];
  
  async analyzeAgencies(agencies: ValidatedAgency[]): Promise<{
    results: AnalysisResult[];
  }>
}

// 5. ENRICHER AGENT - Enriquecimiento contextual según intent
interface EnricherAgent {
  tools: ['deep-analysis', 'inventory-checker', 'web-presence'];
  
  async enrichByIntent(params: {
    agencies: AnalysisResult[];
    queryIntent: QueryIntent;
  }): Promise<{
    enriched: EnrichedResult[];
    _sources?: Citation[]; // URLs de inventario, noticias, etc.
  }>
}

// 6. CHAT AGENT - Maneja conversaciones
interface ChatAgent {
  async chat(params: {
    messages: Message[];
    searchContext?: SearchContext;
  }): Promise<{
    response: string;
    _sources?: Citation[]; // Si menciona fuentes externas
  }>
}
```

### Sistema de Citations (Solo Fuentes Externas)

```typescript
// Solo para fuentes externas (Google, inventarios, noticias, etc.)
interface Citation {
  id: number;        // [1], [2], etc.
  url: string;       // URL externa
  title: string;     // Título del recurso
  type: 'google_places' | 'inventory' | 'news' | 'website';
}

// Ejemplo de respuesta con citations
{
  agencies: [...],
  _sources: [
    {
      id: 1,
      url: "https://www.google.com/maps/search/agencias+nissan",
      title: "Google Places - Agencias Nissan",
      type: "google_places"
    },
    {
      id: 2,
      url: "https://www.nissan.com.mx/encuentra-tu-distribuidor", 
      title: "Nissan México - Distribuidores Oficiales",
      type: "website"
    }
  ]
}
```

### Plan de Migración Gradual

**Fase 1: Wrapper sobre pipeline existente**
```typescript
// Mantener pipeline actual funcionando
const orchestrator = new OrchestratorAgent({
  pipeline: existingDataPipeline, // Reutilizar código actual
  agents: {} // Vacío inicialmente
});
```

**Fase 2: Extraer herramientas**
```typescript
// Migrar funciones a herramientas independientes
tools/
├── google-places/
│   └── searchAgencies() // Desde google-places.ts
├── reviews/
│   └── getReviews()     // Desde apify-reviews-sync.ts
└── trust-scoring/
    └── analyzeTrust()   // Desde trust-engine.ts
```

**Fase 3: Crear agentes especializados**
```typescript
// Reemplazar secciones del pipeline con agentes
agents: {
  search: new SearchAgent({ tools: ['google-places'] }),
  validator: new ValidatorAgent({ tools: ['reviews'] }),
  analyzer: new AnalyzerAgent({ tools: ['trust-scoring'] })
}
```

**Fase 4: Enriquecimiento por intent**
```typescript
// Nuevos agentes según el query intent
if (queryIntent.needsInventory) {
  enricher.tools.push('inventory-checker');
}
if (queryIntent.needsFinancing) {
  enricher.tools.push('financing-calculator');
}
```

## 📱 Principios de Diseño Mobile-First

### Experiencia Mobile Extraordinaria
```typescript
// Breakpoints mobile-first
const breakpoints = {
  mobile: '0px',      // Base
  tablet: '768px',    // iPad
  desktop: '1024px'   // Opcional
};

// Touch targets mínimos
const touchTargets = {
  citation: '44x44px',  // [1][2] clickeables
  button: '48x48px',    // CTAs principales
  card: 'full-width'    // Tarjetas de agencias
};
```

### Componentes Mobile Optimizados
1. **Chat Interface**: Full screen con input fijo abajo
2. **Citations**: Números grandes [1][2] fáciles de tocar
3. **Sources Panel**: Bottom sheet drawer (no sidebar)
4. **Loading**: Skeleton screens y progressive disclosure
5. **Offline**: Service worker para cache básico

## 🎯 Análisis de Viabilidad y Contexto

### ✅ Componentes Existentes Reutilizables
- Sistema de agentes modular (Mastra.ai)
- Infraestructura Next.js 14 con App Router
- Integración Google Places API via wrappers
- Supabase con pgvector para búsqueda semántica
- Sistema de tipos TypeScript completo
- UI base con TailwindCSS

### 🚧 Componentes a Desarrollar

#### 1. Sistema de Embeddings por Vehículo
```typescript
interface VehicleDocument {
  id: string;
  type: 'vehicle'; // Agregar a types existentes
  agency_place_id: string;
  content: string; // Para generar embedding
  embedding: vector(1536);
  metadata: {
    // Datos del vehículo
    marca: string;
    modelo: string;
    año: number;
    precio: number;
    kilometraje: number;
    transmision: string;
    
    // Relación con agencia
    agency_name: string;
    agency_trust_score: number;
    
    // URLs y media
    ficha_url: string;
    imagenes: string[];
    
    // Timestamps
    scraped_at: Date;
    last_seen_at: Date;
  }
}
```

#### 2. Herramientas Mastra con Citations
```typescript
// Ejemplo: Tool actualizada con _sources
const searchDealerships = createTool({
  id: "search_dealerships",
  description: "Buscar concesionarios de autos",
  inputSchema: z.object({
    query: z.string(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }),
  execute: async ({ context }) => {
    const { query, location } = context;
    
    // 1. Buscar agencias cercanas
    const agencies = await searchNearbyAgencies(location);
    
    // 2. Validación 2-fases
    const validated = await validateAgencies(agencies);
    
    return {
      dealerships: validated,
      _sources: [{
        id: crypto.randomUUID(),
        title: `Búsqueda de concesionarios: "${query}"`,
        url: `https://karmatic.io/search?q=${encodeURIComponent(query)}`,
        type: 'search',
        resultCount: validated.length,
        location: `${location.lat},${location.lng}`,
        timestamp: new Date().toISOString()
      }]
    };
  }
});
```

### 📊 Fuentes de Datos y Limitaciones

#### APIs Confirmadas
1. **Google Places API**
   - ✅ Datos básicos de agencias
   - ❌ Solo 5 reseñas máximo
   - ✅ Place ID almacenable permanentemente
   - ❌ URLs de reseñas NO almacenables

2. **Apify Google Maps Reviews Scraper**
   - ✅ Hasta miles de reseñas completas
   - ✅ Análisis profundo de patrones
   - ⚠️ Requiere polling (30-60s)
   - 💰 Costo por actor run

3. **Perplexity API**
   - ✅ Descubrimiento de URLs de inventario
   - ✅ Análisis contextual profundo
   - ✅ Búsqueda de información adicional
   - 💰 Costo por query

4. **OpenRouter**
   - ✅ Multi-modelo para optimización
   - ✅ Fallback automático
   - ✅ Routing por tipo de tarea
   - 💰 Pago por tokens

### 🎯 Estrategia de Análisis Completo

```typescript
// Flujo de análisis integral
async function analyzeAgencyComplete(placeId: string, userQuery?: string) {
  // 1. Datos básicos (Google Places)
  const basicData = await getPlaceDetails(placeId);
  
  // 2. Reseñas completas (Apify)
  const reviews = await scrapeAllReviews(placeId);
  
  // 3. Descubrimiento de URLs (Perplexity)
  const perplexityData = await discoverAgencyInfo(basicData.name, basicData.address);
  // Returns: website, inventory URLs, social media, news
  
  // 4. Scraping de inventario
  const inventory = await scrapeInventory(perplexityData.inventoryUrl);
  
  // 5. Análisis integral
  const analysis = {
    trustScore: calculateTrustScore(reviews),
    totalInventory: inventory.length,
    fraudIndicators: detectFraudPatterns(reviews),
    // Si hay query específica del usuario
    ...(userQuery && {
      queryMatch: findMatchingVehicles(inventory, userQuery),
      specificAnswer: `Tienen ${matchCount} ${userQuery} disponibles`
    })
  };
  
  // 6. Generar embeddings
  await generateEmbeddings(analysis, inventory);
  
  return analysis;
}
```

### 🔍 Manejo de Citations Compliant

```typescript
// Citations para reseñas - URL general de Google Places
interface ReviewSource {
  id: string;
  title: string; // "Reseñas de Google Places - [Agencia]"
  url: string;   // https://google.com/maps/place/?q=place_id:XXX
  type: 'reviews';
  metadata: {
    reviewCount: number;
    averageRating: number;
    lastUpdated: Date;
  }
}

// Citations para inventario - URL específica
interface InventorySource {
  id: string;
  title: string; // "Inventario de [Agencia]"
  url: string;   // URL real del sitio
  type: 'inventory';
  metadata: {
    vehicleCount: number;
    lastScraped: Date;
  }
}
```

## 🏆 FASE 1: FOUNDATION (MVP)

### 1.1 Infraestructura Base ✅ COMPLETADO
- ✅ Supabase configurado con pgvector
- ✅ Redis/Upstash para caché
- ✅ OpenRouter integrado
- ✅ Next.js 14 con App Router
- ✅ Sistema de tipos TypeScript

### 1.2 Sistema de Validación 2-Fases ✅ COMPLETADO

```typescript
// Implementación actual optimizada
interface ValidationPhases {
  phase1: {
    reviewCount: 15;        // Reseñas relevantes
    minConfidence: 0.70;    // 70% para pasar a fase 2
    timeout: 10000;         // 10s máximo
    cache: '24h';          // TTL de validación
  };
  phase2: {
    reviewCount: 'all';     // Análisis completo
    deepAnalysis: true;     // Patrones avanzados
    timeout: 45000;         // 45s máximo
  };
}
```

**Arquitectura implementada**:
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Phase 1   │ 70% │   Phase 2    │     │   Cache     │
│ Quick Valid ├────►│ Deep Analysis├────►│  24h TTL    │
└─────────────┘     └──────────────┘     └─────────────┘
     15 rev            All reviews          Redis/Memory
```

### 1.3 Chat Conversacional con Citations 🚧 PRIORIDAD 1

#### Arquitectura de Citations
```typescript
// Agent con instrucciones de citación
const karmaticAgent = new Agent({
  name: "Karmatic Assistant",
  description: "Asistente anti-fraude automotriz con citations",
  instructions: `
    Eres el asistente de Karmatic, especializado en proteger a compradores de autos contra fraudes.
    
    REGLAS DE CITACIÓN OBLIGATORIAS:
    1. SIEMPRE cita fuentes EXTERNAS usando [1], [2], etc.
    2. Coloca las citas INMEDIATAMENTE después de la información
    3. Si combinas fuentes, usa múltiples citas [1][2]
    4. Numera secuencialmente desde 1 en cada respuesta
    
    FORMATO DE CITACIÓN:
    - "Encontré 5 agencias Nissan cerca de ti[1]"
    - "Según reseñas de Google[2], AutoMax tiene 92% de confianza"
    - "En su sitio web[3] tienen 3 Camry disponibles desde $420,000"
    
    IMPORTANTE: Solo cita fuentes EXTERNAS (Google, sitios web, etc).
    NO cites búsquedas internas o análisis propios de Karmatic.
  `,
  model: openrouter('gpt-4o-mini'),
  tools: {
    searchDealerships: searchDealershipsWithSources,
    analyzeReviews: analyzeReviewsWithSources,
    searchInventory: searchInventoryWithSources,
    getVehicleDetails: getVehicleDetailsWithSources,
    compareVehicles: compareVehiclesWithSources,
    getMarketInsights: getMarketInsightsWithSources,
    getSearchHistory: getSearchHistoryWithSources,
    saveUserPreference: saveUserPreferenceWithSources
  }
});
```

#### Herramientas a Actualizar (8 total)
```typescript
// 1. search-dealerships.ts
const searchDealershipsWithSources = createTool({
  id: "search_dealerships",
  execute: async ({ query, location }) => {
    const results = await pipeline.searchAgencies(query, location);
    return {
      dealerships: results,
      _sources: [{
        id: nanoid(),
        title: `Google Maps - Búsqueda de agencias`,
        url: `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${location.lat},${location.lng},14z`,
        type: 'google_places',
        timestamp: new Date().toISOString()
      }]
    };
  }
});

// 2. analyze-reviews.ts  
const analyzeReviewsWithSources = createTool({
  id: "analyze_reviews",
  execute: async ({ placeId, agencyName }) => {
    const analysis = await pipeline.analyzeReviews(placeId);
    return {
      analysis,
      _sources: [{
        id: nanoid(),
        title: `Reseñas de Google - ${agencyName}`,
        url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        type: 'google_places',
        metadata: {
          reviewCount: analysis.totalReviews,
          averageRating: analysis.rating
        }
      }]
    };
  }
});

// 3. search-inventory.ts
const searchInventoryWithSources = createTool({
  id: "search_inventory",
  execute: async ({ agencyUrl, query }) => {
    const inventory = await scrapeInventory(agencyUrl);
    return {
      vehicles: inventory,
      _sources: [{
        id: nanoid(),
        title: `Inventario - ${new URL(agencyUrl).hostname}`,
        url: agencyUrl,
        type: 'inventory'
      }]
    };
  }
});

// 4-8: Similar pattern for remaining tools...
```

#### UI Components Mobile-First

```typescript
// components/chat/CitationText.tsx
export function CitationText({ text, citations }: Props) {
  const renderWithCitations = (text: string) => {
    return text.split(/(\[\d+\])/g).map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        return (
          <button
            key={i}
            onClick={() => showSourcePanel(index)}
            className="citation-link"
            style={{ 
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            [{index}]
          </button>
        );
      }
      return part;
    });
  };
  
  return <span className="citation-text">{renderWithCitations(text)}</span>;
}

// components/chat/SourcesPanel.tsx - Mobile Bottom Sheet
export function SourcesPanel({ sources, isOpen, onClose }: Props) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Fuentes</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto">
          {sources.map((source, i) => (
            <SourceCard 
              key={source.id}
              index={i + 1}
              source={source}
              className="mb-3 p-4 touch-manipulation"
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### 1.4 Búsqueda Híbrida con pgvector 🚧 PRIORIDAD 2

#### Modelos de Datos

```sql
-- Tabla agencies mínima (decisión tomada)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT UNIQUE NOT NULL,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_agencies_place_id ON agencies(place_id);

-- Actualizar types en documents
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vehicle';
```

#### Generación de Embeddings

```typescript
// Embedding para análisis de agencia
async function generateAgencyEmbedding(analysis: AgencyAnalysis) {
  const content = `
    Agencia: ${analysis.name}
    Ubicación: ${analysis.address}
    Confianza: ${analysis.trustScore}/10
    Especialidades: ${analysis.specialties.join(', ')}
    Fortalezas: ${analysis.strengths.join(', ')}
    Alertas: ${analysis.fraudIndicators.join(', ')}
    Reseñas: ${analysis.reviewSummary}
  `;
  
  const embedding = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: content
  });
  
  await supabase.from('documents').insert({
    type: 'agency_analysis',
    content,
    embedding: embedding.data[0].embedding,
    metadata: {
      place_id: analysis.placeId,
      trust_score: analysis.trustScore,
      last_analysis: new Date()
    }
  });
}

// Embedding para vehículo individual
async function generateVehicleEmbedding(vehicle: Vehicle, agency: Agency) {
  const content = `
    ${vehicle.year} ${vehicle.make} ${vehicle.model}
    Precio: $${vehicle.price.toLocaleString('es-MX')}
    Kilometraje: ${vehicle.mileage}km
    Transmisión: ${vehicle.transmission}
    Color: ${vehicle.color}
    Características: ${vehicle.features.join(', ')}
    Vendido por: ${agency.name} (confianza: ${agency.trustScore}/10)
  `;
  
  const embedding = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: content
  });
  
  await supabase.from('documents').insert({
    type: 'vehicle',
    content,
    embedding: embedding.data[0].embedding,
    metadata: {
      ...vehicle,
      agency_place_id: agency.placeId,
      agency_name: agency.name,
      agency_trust_score: agency.trustScore
    }
  });
}
```

#### Búsqueda Semántica

```typescript
// Búsqueda híbrida: "autos híbridos familiares en Polanco"
async function hybridSearch(query: string, location: LatLng, filters?: SearchFilters) {
  // 1. Generar embedding de la query
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Búsqueda vectorial + filtros geoespaciales
  const { data: results } = await supabase.rpc('hybrid_search', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 50,
    location_lat: location.lat,
    location_lng: location.lng,
    max_distance_km: filters?.maxDistance || 10,
    min_trust_score: filters?.minTrustScore || 7,
    vehicle_type: filters?.vehicleType || null
  });
  
  // 3. Agrupar por agencia y rankear
  return groupAndRankResults(results);
}

// RPC function en Supabase
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  location_lat float,
  location_lng float,
  max_distance_km float,
  min_trust_score float,
  vehicle_type text
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  WHERE 
    d.type IN ('agency_analysis', 'vehicle')
    AND (1 - (d.embedding <=> query_embedding)) > match_threshold
    AND (
      -- Filtro geoespacial para agencias cercanas
      d.metadata->>'agency_place_id' IN (
        SELECT place_id 
        FROM agencies a
        JOIN places p ON p.place_id = a.place_id
        WHERE ST_DWithin(
          p.location::geography,
          ST_MakePoint(location_lng, location_lat)::geography,
          max_distance_km * 1000
        )
      )
    )
    AND COALESCE((d.metadata->>'trust_score')::float, 0) >= min_trust_score
    AND (vehicle_type IS NULL OR d.metadata->>'tipo' = vehicle_type)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 1.5 UI/UX Mobile-First del MVP 🚧 PRIORIDAD 3

#### Landing Page con Buscador
```typescript
// app/page.tsx - Mobile optimized
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Full viewport mobile */}
      <section className="flex-1 flex flex-col justify-center px-4 py-8">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
          Protégete del fraude automotriz
        </h1>
        <p className="text-lg text-gray-600 text-center mb-8">
          Analizamos miles de reseñas para encontrar agencias confiables
        </p>
        
        {/* Search Component - Touch optimized */}
        <SearchInput 
          placeholder="Busca tu auto ideal..."
          className="w-full max-w-2xl mx-auto"
          touchTarget="48px"
          showVoiceInput={isMobile}
        />
        
        {/* Quick filters - Horizontal scroll mobile */}
        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 scrollbar-hide">
          <FilterChip>SUV Familiar</FilterChip>
          <FilterChip>Sedán Económico</FilterChip>
          <FilterChip>Pickup Trabajo</FilterChip>
          <FilterChip>Híbrido</FilterChip>
        </div>
      </section>
      
      {/* Trust indicators */}
      <section className="bg-gray-50 px-4 py-6">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-gray-600">Agencias analizadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold">47K+</div>
            <div className="text-sm text-gray-600">Reseñas verificadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold">93%</div>
            <div className="text-sm text-gray-600">Fraudes evitados</div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

#### Chat Interface Móvil
```typescript
// components/chat/MobileChatInterface.tsx
export function MobileChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSourcesPanelOpen, setSourcesPanelOpen] = useState(false);
  
  return (
    <div className="h-[100dvh] flex flex-col bg-white">
      {/* Header fijo */}
      <header className="shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Karmatic Assistant</h2>
          <button className="p-2">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Messages area - con safe area para iOS */}
      <div className="flex-1 overflow-y-auto pb-safe">
        <div className="px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg}
              onCitationClick={(index) => setSourcesPanelOpen(true)}
            />
          ))}
        </div>
      </div>
      
      {/* Input fijo abajo */}
      <div className="shrink-0 border-t bg-white px-4 py-2 pb-safe">
        <ChatInput 
          onSend={handleSend}
          minHeight="48px"
          showVoiceButton
        />
      </div>
      
      {/* Sources panel - bottom sheet */}
      <SourcesPanel 
        sources={currentSources}
        isOpen={isSourcesPanelOpen}
        onClose={() => setSourcesPanelOpen(false)}
      />
    </div>
  );
}
```

## 🚀 FASE 2: INTELLIGENCE

### 2.1 Sistema de Citations Avanzado

#### Preview on Hover/Touch
```typescript
interface CitationPreview {
  desktop: 'hover';    // Mouse hover
  mobile: 'longpress'; // Touch & hold
  delay: 500;         // ms antes de mostrar
}

// Componente con preview
<CitationLink 
  index={1}
  source={source}
  onPreview={(source) => (
    <PreviewCard className="absolute z-50 w-64 p-3">
      <h4 className="font-medium">{source.title}</h4>
      <p className="text-sm text-gray-600">{source.metadata.summary}</p>
      <div className="text-xs text-gray-500 mt-1">
        {source.metadata.resultCount} resultados • 
        {formatRelativeTime(source.timestamp)}
      </div>
    </PreviewCard>
  )}
/>
```

### 2.2 Análisis Profundo con ML

#### Detección de Patrones Avanzados
```typescript
interface FraudDetectionML {
  patterns: {
    reviewBombing: {
      detect: 'Multiple reviews in short timespan';
      threshold: '10+ reviews in 24h';
      confidence: 0.85;
    };
    templateReviews: {
      detect: 'Similar language patterns';
      similarity: 0.90;
      minSamples: 5;
    };
    suspiciousTimings: {
      detect: 'Reviews only during business hours';
      pattern: 'No weekend/night reviews';
      confidence: 0.75;
    };
  };
}
```

### 2.3 Caché Inteligente Multi-nivel

```typescript
class MultiLevelCache {
  // L1: In-memory (inmediato)
  private memCache = new Map<string, CacheEntry>();
  
  // L2: Redis (milisegundos)
  private redis = getRedisClient();
  
  // L3: Supabase (segundos)
  private db = supabase.from('cache');
  
  async get(key: string): Promise<any> {
    // Try L1
    if (this.memCache.has(key)) {
      return this.memCache.get(key).value;
    }
    
    // Try L2
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      this.memCache.set(key, { value: redisValue, ttl: 300 });
      return redisValue;
    }
    
    // Try L3
    const { data } = await this.db
      .select('value')
      .eq('key', key)
      .single();
      
    if (data) {
      // Populate upper levels
      await this.redis.setex(key, 3600, data.value);
      this.memCache.set(key, { value: data.value, ttl: 300 });
      return data.value;
    }
    
    return null;
  }
}
```

## 🏆 FASE 3: SCALE

### 3.1 Arquitectura Multi-Agent

```typescript
// Sistema de agentes especializados
const agentSystem = {
  orchestrator: new OrchestratorAgent({
    name: "Karmatic Orchestrator",
    role: "Coordinate specialized agents",
    subAgents: {
      inventory: new InventoryAgent({
        tools: ['scrapeInventory', 'parseVehicleData'],
        specialization: 'Real-time inventory updates'
      }),
      
      reviews: new ReviewAnalysisAgent({
        tools: ['scrapeReviews', 'detectFraud', 'summarize'],
        specialization: 'Deep review analysis'
      }),
      
      market: new MarketIntelligenceAgent({
        tools: ['analyzePricing', 'detectTrends', 'compareMarket'],
        specialization: 'Market insights and pricing'
      }),
      
      fraud: new FraudDetectionAgent({
        tools: ['patternMatching', 'nlpAnalysis', 'crossValidation'],
        specialization: 'Advanced fraud detection'
      })
    }
  }),
  
  async processQuery(query: string, context: Context) {
    // Parallel execution
    const tasks = this.orchestrator.delegateTasks(query);
    const results = await Promise.all(tasks);
    return this.orchestrator.synthesize(results);
  }
};
```

### 3.2 Real-time Updates

```typescript
// WebSocket para actualizaciones en vivo
class RealtimeUpdates {
  private ws: WebSocket;
  private subscriptions: Map<string, Subscription>;
  
  subscribe(agencyId: string, callback: UpdateCallback) {
    this.ws.send(JSON.stringify({
      action: 'subscribe',
      type: 'agency_updates',
      agencyId
    }));
    
    this.subscriptions.set(agencyId, {
      callback,
      types: ['inventory', 'reviews', 'alerts']
    });
  }
  
  handleMessage(event: MessageEvent) {
    const update = JSON.parse(event.data);
    
    switch(update.type) {
      case 'new_vehicle':
        this.notifySubscribers(update.agencyId, {
          type: 'inventory',
          message: `Nuevo ${update.vehicle.make} ${update.vehicle.model} disponible`,
          vehicle: update.vehicle
        });
        break;
        
      case 'fraud_alert':
        this.notifySubscribers(update.agencyId, {
          type: 'alert',
          severity: 'high',
          message: 'Detectamos actividad sospechosa en reseñas'
        });
        break;
    }
  }
}
```

## 🌟 FASE 4: EXCELLENCE

### 4.1 Deep Research Mode

```typescript
// Modo investigación profunda (2-4 minutos)
class DeepResearchMode {
  async research(query: string, context: Context): Promise<DeepReport> {
    // 1. Descomponer en sub-tareas
    const subtasks = this.decomposeQuery(query);
    
    // 2. Búsquedas masivas paralelas
    const searches = subtasks.flatMap(task => [
      this.searchInventories(task),
      this.searchReviews(task),
      this.searchNews(task),
      this.searchSocialMedia(task),
      this.searchGovernmentRecords(task)
    ]);
    
    const allResults = await Promise.all(searches);
    
    // 3. Verificación cruzada
    const validated = await this.crossValidate(allResults);
    
    // 4. Síntesis y reporte
    return this.generateDeepReport({
      findings: validated,
      confidence: this.calculateConfidence(validated),
      visualizations: this.createCharts(validated),
      recommendations: this.generateRecommendations(validated)
    });
  }
}
```

### 4.2 Predictive Intelligence

```typescript
interface PredictiveAnalysis {
  agencyHealth: {
    predict: 'closure_risk' | 'growth_expected' | 'stable';
    confidence: number;
    factors: string[];
    timeframe: '3_months' | '6_months' | '1_year';
  };
  
  marketTiming: {
    bestTimeToBuy: {
      month: string;
      reason: string;
      savingsExpected: number;
    };
  };
  
  fraudPrediction: {
    emergingPatterns: Pattern[];
    riskLevel: 'low' | 'medium' | 'high';
    preventiveActions: string[];
  };
}
```

## 📊 Métricas de Éxito y KPIs

### MVP (Fase 1)
| Métrica | Actual | Target | Método de Medición |
|---------|--------|--------|-------------------|
| Tiempo análisis/agencia | ~10s | <10s | Performance.now() |
| Precisión detección fraude | 85% | >85% | Validación manual |
| Respuestas con citations | 100% | 100% | Análisis de logs |
| Mobile UX Score | - | >90/100 | Lighthouse |
| Touch target compliance | - | 100% | Audit manual |

### Producción (Fase 4)
| Métrica | Target | Importancia |
|---------|--------|-------------|
| Tiempo respuesta (cache) | <2s | Critical |
| Precisión fraude | >95% | Critical |
| MAU (usuarios activos) | 50K+ | Business |
| Conversión free→paid | >5% | Business |
| Mobile engagement | >70% | UX |
| API requests/mes | 1M+ | Scale |

## 🛠️ Decisiones Técnicas Clave

### 1. Arquitectura 2-Fases (Confirmado)
```typescript
// Optimización costo-beneficio comprobada
const validationStrategy = {
  phase1: {
    cost: '$0.02',      // 15 reviews
    time: '~5s',        // Rápido
    accuracy: '70%',    // Suficiente para filtrar
    passRate: '30%'     // Solo 30% pasan a fase 2
  },
  phase2: {
    cost: '$0.20',      // 150+ reviews  
    time: '~45s',       // Profundo
    accuracy: '95%',    // Alta precisión
    onlyFor: 'validated' // Solo agencias validadas
  },
  totalSavings: '~70%'   // Reducción de costos
};
```

### 2. pgvector + Supabase (Confirmado)
- ✅ Sin vendor lock-in (open source)
- ✅ Búsqueda híbrida SQL + vectorial
- ✅ Costo incluido en Supabase
- ✅ Escalamiento automático

### 3. Mastra.ai para Agente (Confirmado)
- ✅ Manejo de conversaciones
- ✅ Herramientas estructuradas
- ✅ Streaming de respuestas
- ✅ Estado de conversación

### 4. Mobile-First Design
- ✅ Touch targets 44px mínimo
- ✅ Bottom sheets para panels
- ✅ Skeleton screens
- ✅ Voice input nativo

### 5. Compliance con Google TOS
```typescript
// Lo que SÍ podemos almacenar
const allowedStorage = {
  placeId: 'permanent',        // Sin límite
  latLng: '30 days',          // Cache temporal
  analysis: 'permanent',       // Nuestro contenido
  embeddings: 'permanent'      // Nuestros vectores
};

// Lo que NO podemos almacenar
const prohibited = {
  reviewText: 'never',         // Contenido de Google
  reviewUrls: 'never',         // URLs individuales
  authorUrls: 'never',         // URLs de perfiles
  authorNames: 'display only'  // Solo mostrar
};
```

## 🚦 Estado Actual y Próximos Pasos

### ✅ Completado (Fase 1.1 - 1.2)
1. **Infraestructura base** con todo configurado ✅
2. **Sistema 2-fases** funcionando y optimizado ✅
3. **Pipeline de validación** con 35+ palabras clave fraude ✅
4. **Integración APIs** (Google Places, Apify, OpenRouter) ✅
5. **Tipos TypeScript** completos ✅
6. **Análisis completo del sistema** actual ✅
7. **Core Trust Engine** implementado e integrado con UI ✅
8. **Trust Indicators** funcionando en la interfaz ✅
9. **Transformación de datos** entre formatos ✅

### ✅ Completado (Fase 1.3 - MVP Query Intent Tool)

**Decisión de Arquitectura**: Reemplazar completamente query-parser.ts con una tool inteligente que aporte valor real al análisis.

#### Fase 1.3 - MVP Query Intent Tool ✅ COMPLETADO

**Objetivo**: Reemplazar el query-parser actual con una tool inteligente que actúe como asesor automotriz experto.

**Tareas de Implementación**:
- [x] Crear tool analyze-query-intent con Kimi K2 ✅
- [x] Definir schemas entrada/salida con Zod ✅
- [x] Implementar soporte multi-país desde inicio ✅
- [x] Extraer país de LocationAutocomplete ✅
- [x] Integrar asesor experto automotriz ✅
- [x] Reemplazar parseQuery en pipeline ✅
- [x] Eliminar query-parser.ts legacy ✅
- [x] Validación frontend para queries no automotrices ✅

**Logros**:
- Tool `analyze-query-intent.ts` completamente implementada
- Soporte para MX, CO, AR, CL con contexto específico
- Detección de queries no automotrices
- Análisis experto con precios, alternativas y estrategias
- Frontend actualizado para extraer y pasar código ISO del país
- Integración completa en pipeline de análisis

**Arquitectura de la Tool**:
```typescript
// Input
{
  query: string
  country: string  // ISO code: 'MX', 'CO', 'AR', etc.
}

// Output - Asesor Automotriz Experto
{
  metadata: {
    country: string
    currency: string
    marketName: string
  }
  
  vehicle: {
    identified: boolean
    make?: string
    model?: string
    type: string
    segment: string
  }
  
  marketInsights: {
    availability: 'common' | 'limited' | 'rare'
    localConsiderations: string[]
  }
  
  pricing: {
    new?: { starting: number, range: string }
    used?: { sweetSpot: { years, price, reason } }
  }
  
  alternatives: {
    direct: Array<{ model, priceComparison, localAdvantage }>
    localFavorites?: Array<{ model, reason }>
  }
  
  analysisStrategy: {
    inventorySearch: { targets, yearRange, countryTips }
    reviewFocus: string[]
    dealerPriorities: { preferred, avoid }
  }
}
```

**Valor Agregado**:
- Conocimiento profundo de cada modelo
- Precios y disponibilidad por país
- Competidores y alternativas inteligentes
- Guía específica para análisis posterior
- Tips locales y regulaciones

### 🔮 Próximas Fases

#### Fase 1.4 - Chat Conversacional + Citations
- [ ] Implementar sistema de citations en herramientas
- [ ] Crear agente Mastra con instrucciones de citación
- [ ] Actualizar 8 herramientas con _sources
- [ ] Parser de citations en streaming para chat
- [ ] CitationText component (mobile-first)
- [ ] SourcesPanel bottom sheet
- [ ] Integrar chat con análisis existente

#### Fase 1.5 - Búsqueda Híbrida con pgvector
- [ ] Crear tabla `agencies` mínima
- [ ] Agregar tipo 'vehicle' a documents
- [ ] Implementar generación de embeddings
- [ ] Función RPC hybrid_search
- [ ] Búsqueda semántica integrada

#### Fase 1.6 - UI/UX Mobile-First MVP
- [ ] Landing page optimizada mobile
- [ ] Chat interface full screen
- [ ] Touch targets 44px mínimo
- [ ] Skeleton screens
- [ ] Progressive disclosure

#### Fase 2 - Intelligence
- [ ] Arquitectura Multi-Agente
- [ ] EnricherAgent con Perplexity
- [ ] Detección de patrones ML
- [ ] Caché inteligente multi-nivel
- [ ] Preview de citations

#### Fase 3 - Scale
- [ ] Real-time updates
- [ ] WebSocket para notificaciones
- [ ] Paralelización de agentes
- [ ] Redis cluster
- [ ] Monitoreo avanzado

#### Fase 4 - Excellence
- [ ] Deep Research Mode
- [ ] Predictive Intelligence
- [ ] Voice interface
- [ ] AR features
- [ ] API pública

### 📋 Checklist Pre-Producción

#### Technical
- [ ] Performance <10s por análisis
- [ ] Mobile Lighthouse >90
- [ ] 100% citations coverage
- [ ] Error handling robusto
- [ ] Monitoring configurado

#### Business  
- [ ] Pricing model definido
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Soporte configurado
- [ ] Analytics/tracking

#### Compliance
- [ ] Google TOS audit
- [ ] GDPR compliance
- [ ] Accesibilidad WCAG 2.1
- [ ] Security audit
- [ ] Load testing

## 🎯 Definición de Éxito

**MVP Success Criteria**:
1. **Funcional**: Chat responde con análisis y citations
2. **Confiable**: >85% precisión en detección fraude  
3. **Mobile**: >90 Lighthouse score, touch compliant
4. **Escalable**: <10s respuesta, arquitectura para crecer
5. **Diferenciado**: "Te protegemos de dónde NO comprar"

**Vision**: Ser el guardián confiable de cada comprador de auto en México, eliminando el fraude de la industria automotriz a través de tecnología y transparencia.

---

## 📚 Documentos de Investigación Relacionados

### Comportamiento del Consumidor
- `/docs/research/comportamiento-compra-automotriz-mexico.md` - Investigación completa sobre:
  - Journey del comprador mexicano
  - Decisión nuevo vs seminuevo (40% considera ambos)
  - Factores por nivel socioeconómico
  - Pain points y tendencias 2024-2025

## 🎯 MVP Query Intent Tool - Especificación Detallada

### Objetivo
Reemplazar completamente el query-parser actual con una tool inteligente que actúe como **asesor automotriz experto**, capaz de entender cualquier tipo de query y proveer guía contextual específica por país.

### Filosofía de Diseño
- **De Parser a Asesor**: No solo extraer entidades, sino aportar conocimiento experto
- **Multi-País desde Inicio**: Diseño escalable para expansión internacional
- **Orientado a Valor**: Cada análisis debe mejorar la búsqueda y resultados posteriores
- **Flexible**: Funciona con queries ultra-específicos o completamente generales

### Casos de Uso y Respuestas

#### 1. **Query Ultra Específico**
```
Input: "mazda mx5"
Output: Especificaciones completas, precios MX, competidores (GR86), 
        alternativas prácticas (Mazda3 Turbo), dónde buscar, qué revisar
```

#### 2. **Query Comparativo**
```
Input: "civic o corolla qué conviene"
Output: Comparación directa, pros/cons de cada uno en México,
        agencias que venden ambos, aspectos clave en reviews
```

#### 3. **Query por Necesidad**
```
Input: "auto para uber economico"
Output: Top 3 modelos (Versa, Aveo, Virtus), consideraciones Uber,
        agencias con financiamiento para conductores, seminuevos ideales
```

#### 4. **Query Exploratorio**
```
Input: "necesito cambiar mi auto"
Output: Preguntas de calificación, categorías sugeridas,
        educación sobre depreciación, nuevo vs seminuevo
```

### Integración con Pipeline

```typescript
// Flujo actual (con query-parser)
query → parseQuery() → búsqueda genérica → análisis uniforme

// Flujo nuevo (con intent tool)
query → analyzeQueryIntent() → búsqueda dirigida → análisis orientado
                ↓
         Conocimiento experto
         Guía específica
         Mejores resultados
```

### Datos de País a Incluir

#### México (MX) - Inicial
- Precios en MXN actualizados
- Versiones vendidas oficialmente
- Consideraciones: verificación, autos chocolate
- Preferencias: SUVs, pickups, financiamiento

#### Expansión Futura
- Colombia (CO): Pico y placa, preferencia sedanes
- Argentina (AR): Impuestos importación, inflación
- Chile (CL): Normas Euro 6, mercado estable

### Métricas de Éxito
- **Cobertura**: 95% queries con análisis útil
- **Velocidad**: <1s para respuesta
- **Precisión**: Precios ±10% reales
- **Relevancia**: Alternativas aceptadas 80%+

*Última actualización: Enero 19, 2025*  
*Documento vivo - Actualizado con cada milestone*  
*Prioridad actual: Fase 1.3 - MVP Query Intent Tool*