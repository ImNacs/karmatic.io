# 📊 Capacidades de Analítica en Mastra

## Resumen Ejecutivo

Mastra proporciona un ecosistema completo de observabilidad y analítica para aplicaciones de AI, permitiendo medir, monitorear y optimizar el rendimiento de agentes, workflows y herramientas en tiempo real.

## 🎯 1. Sistema de Evaluaciones (Evals)

### ¿Qué son las Evaluaciones?

Las evaluaciones son pruebas automatizadas que miden la calidad de las respuestas de los agentes usando métodos basados en modelos, reglas y estadísticas. Cada evaluación devuelve una puntuación normalizada entre 0-1.

### Categorías de Métricas

#### 📏 Precisión y Confiabilidad
| Métrica | Descripción | Caso de Uso |
|---------|-------------|-------------|
| **Hallucination** | Detecta afirmaciones no presentes en el contexto | Verificar que el agente no invente información |
| **Faithfulness** | Mide fidelidad al contexto proporcionado | Asegurar respuestas basadas en fuentes |
| **Content Similarity** | Evalúa consistencia entre respuestas | Verificar coherencia en múltiples consultas |
| **Completeness** | Verifica información completa | Asegurar respuestas exhaustivas |
| **Answer Relevancy** | Evalúa relevancia de respuestas | Medir qué tan bien se responde la pregunta |

#### 🧠 Comprensión del Contexto
| Métrica | Descripción | Caso de Uso |
|---------|-------------|-------------|
| **Context Position** | Analiza ubicación del contexto | Optimizar estructura de respuestas |
| **Context Precision** | Evalúa agrupación lógica | Mejorar coherencia narrativa |
| **Context Relevancy** | Mide uso apropiado del contexto | Evitar información irrelevante |
| **Contextual Recall** | Evalúa exhaustividad | Asegurar uso completo del contexto |

#### ✨ Calidad de Salida
| Métrica | Descripción | Caso de Uso |
|---------|-------------|-------------|
| **Tone Consistency** | Mide consistencia de tono | Mantener voz de marca |
| **Toxicity** | Detecta contenido inapropiado | Filtrar respuestas dañinas |
| **Bias** | Identifica sesgos | Asegurar respuestas equitativas |
| **Prompt Alignment** | Verifica adherencia a instrucciones | Cumplir requerimientos específicos |

### Implementación de Evaluaciones

```typescript
import { Agent } from "@mastra/core/agent";
import { SummarizationMetric } from "@mastra/evals/llm";
import { ContentSimilarityMetric, ToneConsistencyMetric } from "@mastra/evals/nlp";

export const myAgent = new Agent({
  name: "ContentWriter",
  instructions: "You are a content writer",
  model: openai("gpt-4o"),
  evals: {
    summarization: new SummarizationMetric(model),
    contentSimilarity: new ContentSimilarityMetric(),
    tone: new ToneConsistencyMetric(),
  },
});
```

## 📈 2. Observabilidad y Telemetría

### OpenTelemetry (OTLP)

Mastra captura automáticamente trazas de todas las operaciones principales:

```typescript
export const mastra = new Mastra({
  telemetry: {
    serviceName: "mi-aplicacion",
    enabled: true,
    sampling: {
      type: "ratio",
      probability: 0.5 // Captura 50% de las trazas
    },
    export: {
      type: "otlp",
      endpoint: "http://localhost:4318" // SigNoz, Jaeger, etc.
    }
  }
});
```

### Métricas Capturadas Automáticamente

#### 🤖 Agentes
- Tiempo de respuesta total
- Tokens consumidos (entrada/salida)
- Número de pasos ejecutados
- Herramientas invocadas
- Tasa de éxito/error

#### ⚙️ Workflows
- Duración por paso
- Flujo de ejecución
- Datos entrada/salida
- Errores y reintentos
- Estado final

#### 🔧 Herramientas
- Frecuencia de uso
- Tiempo de ejecución
- Tasa de éxito
- Parámetros utilizados
- Errores comunes

#### 🌐 Integraciones
- Latencia de API
- Tasa de respuesta
- Códigos de estado HTTP
- Tamaño de payload
- Timeouts

## 📝 3. Sistema de Logging

### Configuración de Logs

```typescript
import { PinoLogger } from "@mastra/loggers";

export const mastra = new Mastra({
  logger: new PinoLogger({
    name: "Mastra",
    level: "info", // debug, info, warn, error
    transports: {
      console: true,
      file: new FileTransport({ path: "logs/app.log" }),
      upstash: new UpstashTransport({
        listName: "production-logs",
        upstashUrl: process.env.UPSTASH_URL,
        upstashToken: process.env.UPSTASH_TOKEN,
      })
    }
  }),
});
```

### Estructura de Logs

```json
{
  "timestamp": "2025-01-14T10:30:00Z",
  "level": "INFO",
  "message": "Agent completed task",
  "destinationPath": "agent-actions",
  "type": "AGENT",
  "runId": "run_abc123",
  "metadata": {
    "agentId": "assistant",
    "duration": 1234,
    "tokensUsed": 567
  }
}
```

## 🖥️ 4. Dashboards de Monitoreo

### Mastra Dev (Desarrollo Local)

Al ejecutar `mastra dev`, obtienes acceso a un playground completo en `http://localhost:4111/`:

#### Panel de Agentes
- **Chat Interactivo**: Prueba conversaciones en tiempo real
- **Configuración Dinámica**: Ajusta temperatura, top-p, max tokens
- **Trazas Detalladas**: Ve cada paso de la ejecución
- **Evaluaciones en Vivo**: Puntuaciones instantáneas por respuesta
- **Historial**: Revisa conversaciones anteriores

#### Panel de Workflows
- **Visualización de Flujo**: Diagrama interactivo del workflow
- **Ejecución Paso a Paso**: Monitorea progreso en tiempo real
- **Datos I/O**: Inspecciona entradas y salidas de cada paso
- **Métricas de Rendimiento**: Tiempo por paso, uso de recursos
- **Debugging**: Identifica cuellos de botella y errores

#### Panel de Herramientas
- **Pruebas Aisladas**: Ejecuta herramientas individualmente
- **Validación de Schema**: Verifica inputs/outputs
- **Estadísticas de Uso**: Qué agentes usan cada herramienta
- **Rendimiento**: Tiempo promedio de respuesta

### Mastra Cloud (Producción)

El dashboard de producción ofrece:

#### Overview
- Estado actual del deployment
- URLs y endpoints activos
- Variables de entorno configuradas
- Agentes y workflows conectados

#### Deployments
- Historial de despliegues
- Logs de build detallados
- Estado por rama git
- Rollback rápido

#### Logs
- Filtrado por severidad
- Búsqueda en tiempo real
- Exportación de logs
- Alertas configurables

#### Playground
- Prueba agentes en producción
- Monitorea evaluaciones en vivo
- Ejecuta workflows manualmente
- Inspecciona trazas detalladas

## 🔍 5. Métricas de Rendimiento

### Latencia y Tiempo de Respuesta

```typescript
// Métricas automáticas capturadas:
{
  "agent.response_time": 1234, // ms
  "llm.latency": 987,          // ms
  "tool.execution_time": 123,   // ms
  "workflow.total_duration": 5678 // ms
}
```

### Uso de Recursos

```typescript
{
  "tokens.input": 234,
  "tokens.output": 567,
  "tokens.total": 801,
  "cost.estimated": 0.0234, // USD
  "memory.used": 45.6,      // MB
  "api.calls": 12
}
```

### Tasas de Éxito y Error

```typescript
{
  "success_rate": 0.95,      // 95%
  "error_rate": 0.05,        // 5%
  "retry_rate": 0.12,        // 12%
  "timeout_rate": 0.02,      // 2%
  "errors_by_type": {
    "rate_limit": 3,
    "network": 2,
    "validation": 1
  }
}
```

## 📊 6. Analítica Avanzada

### Análisis de Conversaciones

- **Longitud promedio**: Tokens por mensaje
- **Tiempo de respuesta**: P50, P90, P99
- **Turnos por sesión**: Interacciones promedio
- **Temas frecuentes**: Análisis de contenido
- **Sentimiento**: Positivo/negativo/neutral

### Análisis de Calidad

- **Coherencia**: Consistencia entre respuestas
- **Relevancia**: Alineación con consultas
- **Completitud**: Información faltante
- **Claridad**: Legibilidad y estructura
- **Accuracy**: Precisión factual

### Análisis de Costos

- **Costo por conversación**: Desglose detallado
- **Modelos más costosos**: Identificar gastos
- **Optimización**: Sugerencias de ahorro
- **Proyecciones**: Estimaciones futuras
- **ROI**: Retorno de inversión

## 🔧 7. Integraciones con Proveedores

### Proveedores Soportados

| Proveedor | Especialidad | Configuración |
|-----------|--------------|---------------|
| **SigNoz** | Trazas y métricas open source | `endpoint: "http://signoz:4318"` |
| **Langfuse** | LLM observability | `new LangfuseExporter({...})` |
| **Braintrust** | Evaluación continua | API key required |
| **LangSmith** | Debug de cadenas LLM | Project ID needed |
| **New Relic** | APM completo | License key |
| **Datadog** | Monitoreo empresarial | API key |

### Ejemplo de Integración

```typescript
// Langfuse para Next.js
import { LangfuseExporter } from "langfuse-vercel";

export function register() {
  const exporter = new LangfuseExporter({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: "https://cloud.langfuse.com"
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "karmatic-ai",
    }),
    traceExporter: exporter,
  });

  sdk.start();
}
```

## 💡 8. Casos de Uso Prácticos

### 1. Optimización de Costos

```typescript
// Identificar llamadas costosas
const costAnalysis = await mastra.telemetry.query({
  metric: "tokens.total",
  groupBy: "agent.id",
  orderBy: "cost.estimated DESC",
  limit: 10
});

// Implementar caché para respuestas frecuentes
const cachedResponse = await cache.get(queryHash);
if (!cachedResponse) {
  const response = await agent.generate(query);
  await cache.set(queryHash, response, { ttl: 3600 });
}
```

### 2. Detección de Degradación

```typescript
// Monitorear puntuaciones de evaluación
const evalTrend = await mastra.evals.getTrend({
  metric: "faithfulness",
  period: "7d",
  threshold: 0.8
});

if (evalTrend.declining) {
  // Alertar al equipo
  await notify.slack({
    channel: "#ai-alerts",
    message: "⚠️ Faithfulness score declining: " + evalTrend.current
  });
}
```

### 3. A/B Testing de Prompts

```typescript
// Configurar experimento
const experiment = {
  control: "You are a helpful assistant",
  variant: "You are an expert assistant with deep knowledge"
};

// Ejecutar pruebas
const results = await mastra.experiments.run({
  agent: "assistant",
  prompts: experiment,
  samples: 1000,
  metrics: ["relevancy", "completeness", "tone"]
});

// Analizar resultados
console.log("Winner:", results.winner);
console.log("Improvement:", results.improvement);
```

### 4. Debugging en Producción

```typescript
// Buscar conversación problemática
const problematicThread = await mastra.logs.search({
  level: "ERROR",
  type: "AGENT",
  timeRange: "1h",
  contains: "timeout"
});

// Reproducir con trazas detalladas
const replay = await mastra.debug.replay({
  threadId: problematicThread.id,
  enableTracing: true,
  verbosity: "debug"
});
```

## 🚀 Mejores Prácticas

1. **Configura Evaluaciones Desde el Inicio**
   - Define métricas clave para tu caso de uso
   - Establece umbrales de calidad mínimos
   - Automatiza alertas para degradación

2. **Usa Sampling Inteligente**
   - No traces 100% en producción (costoso)
   - Aumenta sampling para usuarios nuevos
   - Captura 100% de errores

3. **Implementa Dashboards Personalizados**
   - KPIs específicos de tu negocio
   - Alertas proactivas
   - Reportes ejecutivos

4. **Optimiza Continuamente**
   - Revisa métricas semanalmente
   - Ajusta prompts basándote en datos
   - Experimenta con nuevos modelos

---

**Última actualización**: Enero 2025