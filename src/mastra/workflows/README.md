# 🔄 Workflows Multi-Agente

Este directorio contiene workflows que coordinan múltiples agentes para tareas complejas.

## 📋 ¿Qué son los Workflows?

Los workflows en Mastra permiten:
- Orquestar múltiples agentes
- Ejecutar tareas en secuencia o paralelo
- Implementar lógica condicional
- Manejar errores y reintentos
- Crear flujos de trabajo complejos

## 🏗️ Arquitectura de Workflows

```
┌─────────────────┐
│   User Input    │
└────────┬────────┘
         │
    ┌────▼────┐
    │Workflow │
    │ Engine  │
    └────┬────┘
         │
    ┌────▼─────────────┐
    │ Step Definition  │
    └────┬─────────────┘
         │
┌────────▼────────┬─────────────┬──────────────┐
│ Agent 1         │ Agent 2     │ Agent 3      │
│ (Search)        │ (Analysis)  │ (Recommend)  │
└─────────────────┴─────────────┴──────────────┘
```

## 🛠️ Workflows Planeados

### 1. **Agency Discovery Workflow**

Flujo completo de descubrimiento de agencias.

```typescript
import { createWorkflow } from "@mastra/core/workflows";
import { searchSpecialistAgent, analysisAgent, recommendationAgent } from "../agents";
import { searchAgenciesTool, analyzeAgenciesTool } from "../tools";

export const agencyDiscoveryWorkflow = createWorkflow({
  name: "Agency Discovery",
  description: "Flujo completo para descubrir y analizar agencias",
  
  steps: [
    {
      id: "gather-requirements",
      agent: searchSpecialistAgent,
      action: "Entender qué tipo de agencia busca el usuario",
      output: "requirements"
    },
    {
      id: "search-agencies",
      agent: searchSpecialistAgent,
      tools: [searchAgenciesTool],
      input: "{{requirements}}",
      action: "Buscar agencias según los requisitos",
      output: "searchResults"
    },
    {
      id: "analyze-options",
      agent: analysisAgent,
      tools: [analyzeAgenciesTool],
      input: "{{searchResults}}",
      action: "Analizar las agencias encontradas",
      output: "analysis",
      parallel: true // Puede ejecutarse en paralelo
    },
    {
      id: "generate-recommendations",
      agent: recommendationAgent,
      input: {
        requirements: "{{requirements}}",
        searchResults: "{{searchResults}}",
        analysis: "{{analysis}}"
      },
      action: "Generar recomendaciones personalizadas",
      output: "recommendations"
    }
  ],
  
  onError: (error, step) => {
    console.error(`Error en paso ${step.id}:`, error);
    // Lógica de manejo de errores
  },
  
  onComplete: (results) => {
    return {
      agencies: results.searchResults,
      analysis: results.analysis,
      recommendations: results.recommendations
    };
  }
});
```

### 2. **Comparison Workflow**

Compara múltiples agencias en detalle.

```typescript
export const comparisonWorkflow = createWorkflow({
  name: "Agency Comparison",
  description: "Compara múltiples agencias lado a lado",
  
  steps: [
    {
      id: "gather-agencies",
      parallel: true,
      tasks: [
        { agent: searchAgent, action: "get-agency-1" },
        { agent: searchAgent, action: "get-agency-2" },
        { agent: searchAgent, action: "get-agency-3" }
      ]
    },
    {
      id: "analyze-each",
      agent: analysisAgent,
      forEach: "{{agencies}}",
      action: "Analizar cada agencia individualmente"
    },
    {
      id: "compare",
      agent: comparisonAgent,
      action: "Comparar todas las agencias"
    },
    {
      id: "recommend",
      agent: recommendationAgent,
      action: "Recomendar la mejor opción"
    }
  ]
});
```

### 3. **Smart Search Workflow**

Búsqueda inteligente con refinamiento iterativo.

```typescript
export const smartSearchWorkflow = createWorkflow({
  name: "Smart Search",
  description: "Búsqueda inteligente con refinamiento",
  
  steps: [
    {
      id: "initial-search",
      agent: searchAgent,
      action: "Búsqueda inicial"
    },
    {
      id: "evaluate-results",
      agent: analysisAgent,
      action: "¿Los resultados son suficientes?",
      branch: {
        sufficient: "generate-report",
        insufficient: "refine-search"
      }
    },
    {
      id: "refine-search",
      agent: searchAgent,
      action: "Refinar criterios de búsqueda",
      loop: {
        maxIterations: 3,
        continueIf: "{{results.insufficient}}"
      }
    },
    {
      id: "generate-report",
      agent: reportAgent,
      action: "Generar reporte final"
    }
  ]
});
```

## 📝 Plantilla para Nuevo Workflow

```typescript
import { createWorkflow } from "@mastra/core/workflows";

export const miWorkflow = createWorkflow({
  name: "Mi Workflow",
  description: "Descripción del workflow",
  
  // Configuración opcional
  config: {
    timeout: 300000, // 5 minutos
    retries: 2,
    parallel: false
  },
  
  // Definición de pasos
  steps: [
    {
      id: "step-1",
      agent: miAgente,
      action: "Descripción de la acción",
      input: "{{previousOutput}}", // Puede referenciar outputs previos
      output: "step1Result",
      
      // Opciones del paso
      required: true,
      timeout: 30000,
      retries: 1
    },
    {
      id: "step-2",
      agent: otroAgente,
      action: "Siguiente acción",
      input: "{{step1Result}}",
      
      // Ejecución condicional
      condition: "{{step1Result.success === true}}",
      
      // Branching
      branch: {
        success: "step-3a",
        failure: "step-3b"
      }
    }
  ],
  
  // Callbacks
  onStart: async (context) => {
    console.log("Iniciando workflow:", context);
  },
  
  onStepComplete: async (step, result) => {
    console.log(`Paso ${step.id} completado:`, result);
  },
  
  onError: async (error, step) => {
    console.error(`Error en ${step.id}:`, error);
    // Manejo de errores
  },
  
  onComplete: async (results) => {
    console.log("Workflow completado:", results);
    return results;
  }
});
```

## 🎯 Patrones Comunes

### Sequential Processing
```typescript
steps: [
  { id: "A", action: "Primera tarea" },
  { id: "B", action: "Segunda tarea", input: "{{A}}" },
  { id: "C", action: "Tercera tarea", input: "{{B}}" }
]
```

### Parallel Processing
```typescript
steps: [
  {
    id: "parallel-tasks",
    parallel: true,
    tasks: [
      { agent: agent1, action: "Tarea 1" },
      { agent: agent2, action: "Tarea 2" },
      { agent: agent3, action: "Tarea 3" }
    ]
  }
]
```

### Conditional Branching
```typescript
steps: [
  {
    id: "check-condition",
    agent: evaluatorAgent,
    branch: {
      case1: "handle-case-1",
      case2: "handle-case-2",
      default: "handle-default"
    }
  }
]
```

### Loops
```typescript
steps: [
  {
    id: "iterative-task",
    agent: processorAgent,
    loop: {
      maxIterations: 5,
      continueIf: "{{result.needsMoreWork}}",
      breakIf: "{{result.isComplete}}"
    }
  }
]
```

## 🔧 Integración con la Aplicación

```typescript
// En tu API route
import { agencyDiscoveryWorkflow } from "@/src/mastra/workflows";

export async function POST(req: Request) {
  const { query } = await req.json();
  
  // Ejecutar workflow
  const result = await agencyDiscoveryWorkflow.execute({
    input: query,
    context: {
      userId: "user-123",
      sessionId: "session-456"
    }
  });
  
  return Response.json(result);
}
```

## 📊 Monitoreo y Debugging

### Logging
```typescript
const workflow = createWorkflow({
  // ...
  logging: {
    level: "debug",
    includeInputs: true,
    includeOutputs: true
  }
});
```

### Tracing
```typescript
// Con OpenTelemetry
const workflow = createWorkflow({
  // ...
  tracing: {
    enabled: true,
    serviceName: "karmatic-workflows"
  }
});
```

## 🚀 Mejores Prácticas

1. **Modularidad**: Crear workflows pequeños y componibles
2. **Error Handling**: Siempre manejar errores en cada paso
3. **Timeouts**: Establecer timeouts apropiados
4. **Idempotencia**: Los pasos deben ser idempotentes
5. **Testing**: Probar cada paso individualmente

## 📚 Recursos

- [Mastra Workflows Documentation](https://mastra.ai/docs/workflows)
- [Workflow Patterns](https://www.workflowpatterns.com/)
- [Agent Orchestration Best Practices](https://arxiv.org/abs/2308.08155)

---

**Última actualización**: Julio 2025