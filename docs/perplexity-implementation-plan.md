# Plan de Implementación: Metodología Perplexity para Análisis de Agencias Automotrices

## 📊 Análisis de Viabilidad

### ✅ Componentes existentes reutilizables:
- Sistema de agentes modular (ranking, reputation, inventory, insights)
- Infraestructura de análisis con `BaseAnalyzer` y `AnalysisManager`
- Integración con Google Maps vía Apify MCP
- Vector storage con Supabase para búsqueda semántica
- Sistema de tipos y arquitectura base

### 🔧 Componentes a desarrollar:
1. **Query Understanding Engine** - Interpretar consultas automotrices
2. **Hybrid Retrieval System** - Combinar múltiples fuentes de datos
3. **Neural Reranker** - Modelo para scoring de relevancia
4. **Citation Engine** - Sistema de referencias verificables
5. **Feedback Loop** - Mejora continua basada en métricas

### 🎯 MVP Definido (Respuesta 1):
**Diferenciadores clave vs Google Maps/Clasificados:**
- **Múltiples fuentes de datos**: No solo ubicación, sino inventario real, precios, reputación
- **Scoring inteligente**: Algoritmo que pondera múltiples factores
- **Análisis de reseñas para FAQs**: Extracción de insights comunes de las reseñas
- **Generación de contenido**: Respuestas personalizadas y contextualizadas
- **Plataforma confiable**: Citas verificables y transparencia en las recomendaciones

**Implicaciones para el plan:**
- ✅ Todas las fases son necesarias para el MVP
- ✅ El scoring inteligente es crítico (Fase 3)
- ✅ El análisis de reseñas debe ser profundo (Fase 2)
- ✅ Las citaciones son esenciales para confiabilidad (Fase 4)

### 📊 Fuentes de Datos Disponibles (Respuesta 2 - ACTUALIZADA):
**Recursos confirmados:**
- ✅ Google Places API (información básica de agencias, pero solo 5 reviews máximo)
- ✅ Apify Google Maps Reviews Scraper (puede obtener miles de reviews)
- ✅ Perplexity API (análisis inteligente y comprensión de contexto)

**Limitaciones importantes:**
- ⚠️ Google Places API: Solo devuelve 5 reviews (limitación hardcoded)
- ⚠️ Google My Business API: Solo para negocios propios, requiere 2-4 semanas aprobación
- ❌ Sin APIs de inventario directo
- ❌ Sin base de datos propia de agencias

**Solución adoptada:**
- Usar Apify's "Google Maps Reviews Scraper" para obtener reviews completas
- Complementar con Google Places API para datos básicos
- Perplexity API para análisis profundo

**Estrategia adaptada:**
1. **Fase inicial**: Maximizar valor con datos públicos disponibles
2. **Perplexity como motor de análisis**: Usar para análisis profundos, encontrar URLs de inventario, redes sociales, etc.
3. **Construcción incremental**: Comenzar con datos públicos, agregar fuentes conforme crezca la base de usuarios
4. **Foco en insights**: Generar valor agregado del análisis profundo de datos públicos

### 🧠 Estrategia de Scoring/Ranking (Respuesta 3):
**Recursos disponibles:**
- ✅ OpenRouter API (LLMs para análisis)
- ✅ Perplexity API (¡Gran oportunidad para simplificar!)
- ✅ Todo en cloud (sin limitaciones de infraestructura local)
- ✅ Hugging Face disponible si es necesario

**Estrategia MVP adaptada:**
1. **MVP inicial**: Scoring basado en reglas ponderadas
   - Distancia (30%)
   - Rating de Google (25%)
   - Análisis de sentimiento de reseñas (25%)
   - Frecuencia de menciones positivas (20%)

2. **Uso de Perplexity API**: 
   - Simplificar la búsqueda multi-fuente
   - Aprovechar su RAG pre-construido
   - Reducir complejidad de implementación

3. **Evolución futura**: Migrar a modelos más sofisticados cuando tengamos métricas de usuario

### 🔍 Tipos de Consultas Esperadas (Respuesta 4):
**Queries identificadas:**
1. **Por precio**: "autos baratos", "menos de 200k"
2. **Marca + Modelo + Año**: "Toyota Camry 2022"
3. **Con financiamiento**: "Honda Civic a crédito"
4. **Por características**: "SUV barato", "autos más seguros"
5. **Combinadas**: "Toyota híbrido con financiamiento"

**Estrategia de Query Understanding:**
1. **Parser de reglas**: Detectar patrones comunes (marca/modelo/año/precio)
2. **Sin filtro por marca**: Si buscan "Toyota Camry", incluir TODAS las agencias confiables, no solo Toyota
3. **Fallback inteligente**: Si no matchea reglas → Perplexity API para interpretación
4. **Categorización dinámica**: 
   - Búsqueda por producto (marca/modelo) - pero sin excluir agencias
   - Búsqueda por necesidad (seguro, familiar, económico)
   - Búsqueda por capacidad financiera (crédito, contado)

### 🎯 Propuesta de Valor Única (Respuesta 5):
**Karmatic: El asistente inteligente del comprador de autos en México**

**Diferenciadores clave:**
1. **Todo en un lugar**: Información completa de agencias + inventario + reseñas + precios
2. **Especialización automotriz**: No es un AI genérico, entiende el contexto mexicano
3. **Del lado del usuario**: Información curada y confiable, sin sesgos de vendedores
4. **Anti-fraude**: Verificación de información y transparencia total
5. **Decisiones informadas**: No solo "dónde" sino también "qué" auto comprar

**Problemas que resuelve:**
- ❌ Clasificados tradicionales → ✅ Plataforma inteligente con análisis
- ❌ Información dispersa → ✅ Agregación unificada
- ❌ Riesgo de fraude → ✅ Verificación y citaciones
- ❌ Complejidad de decisión → ✅ Recomendaciones personalizadas
- ❌ Falta de confianza → ✅ Transparencia total

**Beneficio dual:**
- **Usuarios**: Encuentran el auto ideal en la agencia correcta
- **Agencias**: Reciben feedback para mejorar y atraer más clientes

### 📈 Métricas de Éxito (Respuesta 6):
**KPI Principal:**
- **Conversión a plan pago**: % de usuarios free que se convierten a premium

**Métricas secundarias para optimizar conversión:**
1. **Engagement**:
   - Queries por usuario
   - Tiempo en la plataforma
   - Retención (usuarios que regresan)

2. **Valor percibido**:
   - Calidad de respuestas (feedback directo)
   - Agencias contactadas desde la app
   - Compartir resultados

3. **Limitaciones estratégicas del plan free**:
   - Número de consultas por día/mes
   - Profundidad del análisis
   - Acceso a features premium (comparaciones avanzadas, alertas)

**Implicación para el MVP:**
- Diseñar desde el inicio qué features son free vs premium
- Sistema de tracking robusto para entender qué impulsa conversiones
- A/B testing de límites y features

### 🏗️ Estrategia de Desarrollo (Respuesta 7):
**Decisión: Comenzar desde cero**
- ✅ Oportunidad de diseñar arquitectura óptima desde el inicio
- ✅ Alineación total con metodología Perplexity
- ✅ Sin deuda técnica heredada
- ✅ Enfoque en features que impulsen conversión a pago

**Ventajas de empezar fresh:**
1. Arquitectura moderna y escalable
2. Integración nativa con Perplexity API
3. Diseño orientado a métricas desde el día 1
4. Pipeline optimizado para el caso de uso mexicano

### ⚡ Estrategia de Performance (Respuesta 8):
**Decisión: Todo en tiempo real por costos**
- ✅ Sin gastos en pre-cómputo de agencias no consultadas
- ✅ Pago solo por uso real
- ✅ Flexibilidad total en los datos

**Optimizaciones de latencia sin pre-cómputo:**
1. **Cache inteligente**:
   - Cache de interpretaciones de queries (Redis)
   - Cache de resultados por ubicación + query (TTL: 1 hora)
   - Cache de análisis de reseñas (TTL: 24 horas)

2. **Paralelización agresiva**:
   - Todas las APIs llamadas en paralelo
   - Timeout estricto de 3s por fuente
   - Respuesta parcial si alguna fuente falla

3. **Progressive disclosure**:
   - Mostrar resultados básicos inmediato (< 2s)
   - Enriquecer con análisis profundo mientras carga
   - Usuario ve progreso = percepción de velocidad

**Target de latencia: 3-5s para respuesta completa**

### 🗄️ Estrategia de Datos (Respuesta 9):
**Decisión: 100% dinámico**
- ✅ Sin mantenimiento de base de datos inicial
- ✅ Descubrimiento orgánico basado en búsquedas reales
- ✅ Cero costo de almacenamiento inicial
- ✅ Datos siempre frescos de Google Places

**Implicaciones:**
1. **Bootstrap mínimo**: Solo lógica, sin datos
2. **Aprendizaje orgánico**: El sistema descubre agencias conforme los usuarios buscan
3. **Cache como BD temporal**: Redis almacena agencias consultadas
4. **Escalamiento natural**: La "base de datos" crece con el uso

### 🇲🇽 Contexto del Mercado Mexicano (Respuesta 10):
**Problema principal: FRAUDE y falta de transparencia**

**Foco del análisis:**
1. **Reputación sobre tipo**: No importa si es agencia oficial o lote, sino su ética
2. **Transparencia**: Cómo manejan problemas y errores
3. **Responsabilidad**: Apoyo post-venta y resolución de conflictos
4. **Verificación cruzada**: Reseñas + noticias + redes sociales + YouTube

**Señales de confianza a detectar:**
- ✅ Respuestas a reseñas negativas (muestra responsabilidad)
- ✅ Resolución de problemas documentada
- ✅ Transparencia en precios y condiciones
- ✅ Menciones positivas en redes sociales
- ❌ Patrones de quejas sin resolver
- ❌ Cambios frecuentes de nombre/razón social
- ❌ Discrepancias entre lo anunciado y lo real

**Términos mexicanos clave:**
- Enganche, mensualidades, de contado
- "A cambio" (trade-in)
- Seminuevos, certificados
- "Factura original", "libre de gravamen"

**Estrategia: Usar Perplexity API para entender contexto cultural**

## 📋 Plan de Implementación por Fases

### Fase 1: Query Understanding (1-2 días)

**Estructura de archivos:**
```
📁 src/mastra/analysis/query/
├── parser.ts          # Parseo de consultas automotrices
├── entities.ts        # Extracción de marca, modelo, año
├── intent.ts          # Clasificación de intención
└── context.ts         # Análisis contextual
```

**Tareas:**
- [ ] Implementar parser de reglas para patrones comunes
- [ ] Integrar Perplexity API como fallback para queries complejas
- [ ] Crear extractores de: marca, modelo, año, precio, financiamiento
- [ ] Sistema de cache para interpretaciones exitosas

**Ejemplos de implementación:**
```typescript
// Caso 1: Query simple con reglas
Input: "Toyota Camry 2022 barato"
Output: {
  método: "reglas",
  intención: "compra_vehiculo",
  entidades: {
    marca: "Toyota",
    modelo: "Camry",
    año: 2022,
    precio: "económico"
  }
}

// Caso 2: Query compleja con Perplexity
Input: "autos más seguros para familia con buen financiamiento"
Output: {
  método: "perplexity_api",
  intención: "compra_vehiculo_seguro",
  entidades: {
    características: ["seguridad", "familiar"],
    servicios: ["financiamiento"],
    interpretación: "Usuario busca vehículos con alto rating de seguridad, 
                     espacio familiar (SUV/Minivan), con opciones de crédito"
  }
}
```

### Fase 2: Hybrid Retrieval System (2-3 días)

**Estructura de archivos:**
```
📁 src/mastra/analysis/retrieval/
├── sources/
│   ├── places.ts      # Google Places via Apify
│   ├── inventory.ts   # Web scraping dealerships
│   ├── reviews.ts     # Reseñas múltiples fuentes
│   └── pricing.ts     # Comparación de precios
├── fusion/
│   ├── vector.ts      # Búsqueda vectorial
│   └── hybrid.ts      # Combinación vector+keyword
└── orchestrator.ts    # Coordinador paralelo
```

**Agentes de Búsqueda Paralelos:**

| Agente | Función | Fuente de Datos | Tiempo de Respuesta |
|--------|---------|----------------|-------------------|
| **Places Agent** | Encuentra agencias cercanas | Google Places API ✅ | 200-400ms |
| **Reviews Scraper** | Recopila TODAS las reseñas (100s-1000s) | Apify Google Maps Reviews Scraper ✅ | 3-5s |
| **Trust Analyzer** | Detecta patrones de fraude y confiabilidad | Análisis de reseñas completas | 1-2s |
| **FAQ Generator** | Extrae insights y preguntas frecuentes | NLP sobre reseñas completas | 1-2s |
| **Reputation Scorer** | Calcula score de confianza | Análisis multi-factor de reviews | 500ms |

**Tareas:**
- [ ] Adaptar agentes existentes al nuevo sistema de retrieval
- [ ] Implementar búsqueda paralela con timeout management
- [ ] Crear sistema de fusión híbrida (vectorial + geoespacial)
- [ ] Desarrollar diversity sampling para evitar sesgo

### Fase 3: Scoring Inteligente (1 día) - SIMPLIFICADO

**Estructura de archivos:**
```
📁 src/mastra/analysis/ranking/
├── scorer.ts          # Scoring multi-criterio
├── weights.ts         # Pesos configurables
├── filters.ts         # Filtros de calidad
└── ranker.ts          # Lógica de ranking final
```

**Tareas:**
- [ ] Implementar scoring basado en reglas ponderadas
- [ ] Sistema de pesos configurables para ajuste rápido
- [ ] Filtros de calidad mínima (rating > 3.5, reseñas > 10)
- [ ] Normalización de scores para comparación justa

**Pipeline de Scoring Simplificado:**
1. Recuperación inicial: ~20-30 agencias cercanas
2. Cálculo de score compuesto:
   - Proximidad: (1 - distancia/radio_max) × 0.30
   - Rating: (rating/5) × 0.25
   - Sentimiento: score_sentimiento × 0.25
   - Menciones: score_menciones × 0.20
3. Filtrado: Agencias con score total >0.60
4. Top 10 ordenadas por score

### Fase 4: RAG Pipeline & Citations (2 días)

**Estructura de archivos:**
```
📁 src/mastra/analysis/rag/
├── context/
│   ├── builder.ts     # Construcción de contexto
│   ├── enricher.ts    # Enriquecimiento con metadata
│   └── compressor.ts  # Compresión para LLM window
├── generation/
│   ├── router.ts      # Selector de modelo
│   └── generator.ts   # Generación de respuestas
└── citations/
    ├── tracker.ts     # Tracking de fuentes
    └── formatter.ts   # Formato de referencias
```

**Tareas:**
- [ ] Implementar construcción de contexto fusionado
- [ ] Crear router dinámico de modelos (Sonar, GPT-4, Claude)
- [ ] Desarrollar sistema de citaciones numéricas
- [ ] Implementar verificación de fuentes

**Procesamiento RAG de Tres Etapas:**

**Etapa 1: Recuperación Gruesa (Coarse Retrieval)**
- Búsqueda inicial en un radio de 3000 metros usando PostGIS
- Filtrado por tipo de negocio (car_dealer) y status operativo
- Recuperación de ~50 agencias candidatas con diversidad sampling

**Etapa 2: Reranking Neural**
- Modelo cross-encoder (DeBERTa-v3) para calcular relevancia
- Puntuación basada en: proximidad, inventario match, rating, servicios
- Filtrado de agencias con score <70% de relevancia

**Etapa 3: Fusión Contextual y Generación**
- T5 para fusionar fragmentos relevantes en contexto coherente
- Enriquecimiento con metadata: horarios, servicios, promociones
- Router RL selecciona LLM óptimo según complejidad y latencia

### Fase 5: Feedback Loop & Optimization (1-2 días)

**Estructura de archivos:**
```
📁 src/mastra/analysis/feedback/
├── collectors/
│   ├── clicks.ts      # Click tracking
│   ├── ratings.ts     # User ratings
│   └── conversions.ts # Conversion tracking
└── optimization/
    ├── ranker.ts      # Ajuste de ranking
    └── prompts.ts     # Mejora de prompts
```

**Tareas:**
- [ ] Implementar recolección de métricas de usuario
- [ ] Crear sistema de ajuste de pesos en tiempo real
- [ ] Desarrollar A/B testing para optimización
- [ ] Implementar cache inteligente con Redis

## 🔄 Integración con Sistema Actual

```typescript
// Ejemplo de integración con la arquitectura existente
export class PerplexityAnalyzer extends BaseAnalyzer {
  id = 'perplexity-automotive';
  name = 'Perplexity-style Automotive Analyzer';
  description = 'Análisis completo de agencias usando metodología Perplexity';
  version = '1.0.0';
  
  filters = [
    {
      id: 'query',
      name: 'Consulta de búsqueda',
      type: 'text',
      required: true,
    },
    {
      id: 'radius',
      name: 'Radio de búsqueda (km)',
      type: 'numeric',
      defaultValue: 50,
      validation: { min: 1, max: 200 }
    },
    {
      id: 'searchMode',
      name: 'Modo de búsqueda',
      type: 'categorical',
      options: ['pro', 'deep'],
      defaultValue: 'pro'
    }
  ];
  
  async analyze(context: AnalysisContext, filters: Record<string, any>) {
    // 1. Query Understanding
    const parsed = await this.parseQuery(filters.query);
    
    // 2. Hybrid Retrieval
    const sources = await this.retrieveParallel(parsed, context.agency.location);
    
    // 3. Neural Reranking
    const ranked = await this.rerank(sources, parsed.intent);
    
    // 4. Context Fusion & Generation
    const response = await this.generateWithCitations(ranked);
    
    // 5. Track Feedback
    await this.trackInteraction(response);
    
    return {
      id: `perplexity-${Date.now()}`,
      agencyId: context.agency.id,
      type: this.id,
      timestamp: new Date(),
      data: response,
      score: response.confidence,
      confidence: response.confidence
    };
  }
}
```

## 📊 Métricas de Éxito Ajustadas al Contexto Mexicano

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Detección de fraude | 90% precisión en identificar agencias problemáticas | Validación con casos reportados |
| Confiabilidad del scoring | Score correlaciona con satisfacción real | Feedback post-compra |
| Conversión a pago | >5% free-to-paid | Tracking de suscripciones |
| Retención | >60% usuarios regresan | Analytics de uso |
| Valor percibido | >4.5/5 en utilidad para evitar fraudes | Encuestas |

## ⚠️ Consideraciones Técnicas

1. **Escalabilidad**: 
   - Usar workers para búsquedas paralelas
   - Implementar queue management con Bull/BullMQ
   - Load balancing entre múltiples instancias

2. **Costos**: 
   - Implementar cache agresivo para reducir API calls
   - Batch processing donde sea posible
   - Rate limiting inteligente

3. **Legal**: 
   - Respetar robots.txt y términos de servicio
   - Implementar user-agent apropiado
   - Cumplir con regulaciones de datos

4. **Performance**: 
   - Lazy loading de modelos neural reranking
   - Streaming de respuestas largas
   - Compresión de contexto adaptativa

## 🚀 Plan MVP SIMPLIFICADO - "Karmatic: Tu guardián contra fraudes automotrices"

### MVP Fase 1: Core Trust Engine (3-4 días)
1. **Query Handler Simplificado**
   - Parser básico para marca/modelo/ubicación
   - Perplexity API como fallback para queries complejas
2. **Data Pipeline**
   - Google Places API → Datos básicos
   - Apify Reviews Scraper → Reviews completas (100s-1000s)
   - Cache agresivo en Redis
3. **Trust Score Simple**
   - % reseñas positivas/negativas
   - Detección de palabras clave de fraude
   - Respuestas a quejas (señal de responsabilidad)

### MVP Fase 2: Inteligencia y UX (3-4 días)
1. **Perplexity Integration Avanzada**
   - Análisis profundo: "Dame análisis detallado de [Agencia A]"
   - Descubrimiento automático: URLs inventario, redes sociales, noticias
   - FAQs automáticas desde reviews
   - Búsqueda de información adicional no disponible en APIs
2. **Sistema de Alertas**
   - 🚨 Red flags claros en UI
   - ✅ Señales de confianza destacadas
3. **Citaciones y Enlaces**
   - Links a reviews específicas
   - Enlaces a inventario descubierto
   - Redes sociales de la agencia

### MVP Fase 3: Monetización Básica (2-3 días)
1. **Límites simples**:
   - Free: 3 búsquedas/día
   - Premium: Ilimitado + alertas avanzadas
2. **Analytics mínimo**
   - Conversión free→paid
   - Queries más comunes

### Diferenciador clave redefinido:
**"No solo te decimos dónde comprar, te protegemos de dónde NO comprar"**

## 📁 Estructura SIMPLIFICADA del Proyecto

```
📁 src/
├── lib/
│   ├── karmatic/
│   │   ├── query-parser.ts      # Parser simple de queries
│   │   ├── trust-engine.ts      # Motor de confianza anti-fraude
│   │   ├── data-pipeline.ts     # Orquestador de APIs
│   │   └── types.ts             # Tipos TypeScript
│   ├── apis/
│   │   ├── google-places.ts     # Wrapper Google Places
│   │   ├── apify-reviews.ts     # Wrapper Apify Scraper
│   │   └── perplexity.ts        # Wrapper Perplexity API
│   └── cache/
│       └── redis-client.ts       # Cache con Upstash
├── app/
│   └── api/
│       └── analyze/
│           └── route.ts          # Endpoint principal
└── components/
    └── trust-score-card.tsx      # UI de resultados
```

## 🔧 Stack Técnico Simplificado

**APIs Externas:**
- Google Places API (datos básicos, 5 reviews)
- Apify Google Maps Reviews Scraper (reviews completas)
- Perplexity API (análisis inteligente)

**Infraestructura:**
- Next.js + TypeScript
- Upstash Redis (cache)
- Supabase (usuarios y analytics)
- Vercel (hosting)

**NO necesitamos:**
- Modelos ML propios
- Scrapers complejos
- Base de datos de agencias
- Agentes de Mastra (por ahora)

## 💡 Ejemplo de Flujo Mejorado con Perplexity

```typescript
// Usuario: "Toyota Camry 2022 barato cerca de mi"

1. Query Parser:
   - Detecta: marca=Toyota, modelo=Camry, año=2022, precio=económico
   - NO FILTRA por marca Toyota (incluye todas las agencias)

2. Data Pipeline (paralelo):
   - Google Places: 30 agencias de autos cercanas (todas, no solo Toyota)
   - Apify Scraper: 500+ reviews por agencia top 10
   - Total tiempo: ~4s

3. Trust Engine:
   - Analiza reviews: fraude keywords, sentimiento, respuestas
   - Score: Agencia A (92%), Agencia B (85%), Agencia C (45%)
   
4. Perplexity Deep Analysis (para top agencias):
   Query: "Dame análisis detallado de Autos del Valle ubicada en [dirección]. 
           Incluye: sitio web, inventario Toyota Camry, redes sociales, noticias recientes"
   
   Respuesta Perplexity:
   - URL inventario: autosdevalle.mx/inventario
   - Facebook: facebook.com/autosdelvalle (15K seguidores)
   - Tiene 3 Camry 2022 en stock
   - Noticia: "Premio mejor agencia 2023"

5. Response Enriquecida:
   ✅ Autos del Valle - Multi-marca (92% confianza)
   - 4.8★ (523 reviews analizadas)
   - 📱 facebook.com/autosdelvalle
   - 🚗 3 Toyota Camry 2022 disponibles
   - "Premio mejor agencia 2023"
   - "Aunque no es agencia Toyota oficial, tiene excelente reputación"
   
   ✅ Toyota Centro - Agencia Oficial (85% confianza)
   - 4.5★ (312 reviews)
   - "Servicio oficial pero precios más altos"
```

## 🎯 Ventajas del Enfoque Mejorado

1. **Perplexity como "Swiss Army Knife"**:
   - Análisis profundo sin scrapers propios
   - Descubrimiento de URLs y redes sociales
   - Verificación de inventario
   - Búsqueda de noticias y premios

2. **Sin sesgo de marca**:
   - Incluye TODAS las agencias confiables
   - Mejor opción puede no ser la marca oficial
   - Usuario descubre opciones que no conocía

3. **Información enriquecida**:
   - No solo ratings, sino contexto completo
   - Enlaces directos a inventario
   - Presencia en redes sociales
   - Reconocimientos y noticias

4. **Costos optimizados**:
   - Perplexity solo para top agencias (no todas)
   - Cache agresivo de análisis profundos
   - ROI alto por la calidad de información

## 🔗 Referencias

- Metodología Perplexity original: [docs/projects/perplexity.md]
- Caso de uso automotriz: [docs/projects/caso-de-uso.md]
- APIs limitaciones: Investigación actualizada en este documento