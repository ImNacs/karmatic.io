# 🤖 Agentes AI de Karmatic

Este directorio contiene las definiciones de los agentes AI utilizados en Karmatic.

## 📋 Agentes Disponibles

### karmatic-assistant.ts (Pendiente)

El agente principal de Karmatic que asiste a los usuarios con sus consultas.

**Implementación propuesta:**

```typescript
import { Agent } from "@mastra/core/agent";
import { getDefaultModel, getModel } from "../config/llm-providers";

/**
 * Agente principal de asistencia de Karmatic
 * 
 * Este agente está diseñado para:
 * - Responder preguntas generales sobre la plataforma
 * - Ayudar con la búsqueda de agencias
 * - Proporcionar análisis y recomendaciones
 * - Mantener conversaciones contextuales
 */
export const karmaticAssistant = new Agent({
  name: "Karmatic Assistant",
  instructions: `Eres el Asistente AI de Karmatic, una plataforma inteligente para descubrir y analizar agencias automotrices.
  
  Tu rol principal es ayudar a los usuarios de manera amigable y profesional con:
  - Búsqueda de agencias automotrices
  - Análisis comparativo de opciones
  - Recomendaciones personalizadas
  - Información sobre servicios y ubicaciones
  
  Comportamientos clave:
  - Sé conciso pero completo en tus respuestas
  - Haz preguntas clarificadoras cuando sea necesario
  - Mantén el contexto durante la conversación
  - Sé útil y proactivo con sugerencias
  - Usa un tono profesional pero amigable
  
  Recuerda: Representas a Karmatic, así que siempre sé profesional y útil.`,
  
  // Usar el modelo predeterminado de la configuración
  model: getDefaultModel(),
  
  // Temperatura balanceada para respuestas coherentes pero creativas
  temperature: 0.7,
  
  // TODO: Agregar herramientas cuando se implementen
  // tools: {
  //   searchAgencies: searchAgenciesTool,
  //   getAgencyDetails: getAgencyDetailsTool,
  //   compareAgencies: compareAgenciesTool
  // }
});

/**
 * Factory function para crear agente con modelo específico
 * 
 * @param modelName - Nombre del modelo a usar (ej: 'gpt-4o', 'claude-3-5-sonnet')
 * @returns Nueva instancia del agente con el modelo especificado
 * 
 * @example
 * ```typescript
 * // Crear agente con GPT-4
 * const gpt4Agent = createKarmaticAssistant('gpt-4o');
 * 
 * // Crear agente con Claude
 * const claudeAgent = createKarmaticAssistant('claude-3-5-sonnet');
 * ```
 */
export function createKarmaticAssistant(modelName?: string) {
  return new Agent({
    name: "Karmatic Assistant",
    instructions: karmaticAssistant.instructions,
    model: modelName ? getModel(modelName) : getDefaultModel(),
    temperature: 0.7,
  });
}
```

## 🛠️ Cómo Agregar un Nuevo Agente

1. **Crear archivo del agente:**
   ```bash
   touch src/mastra/agents/mi-agente.ts
   ```

2. **Definir el agente:**
   ```typescript
   import { Agent } from "@mastra/core/agent";
   import { getDefaultModel } from "../config/llm-providers";

   export const miAgente = new Agent({
     name: "Mi Agente Especializado",
     instructions: "Instrucciones específicas...",
     model: getDefaultModel(),
     temperature: 0.5, // Ajustar según necesidad
   });
   ```

3. **Registrar en index.ts:**
   ```typescript
   // src/mastra/index.ts
   import { miAgente } from "./agents/mi-agente";

   export const mastra = new Mastra({
     agents: { 
       karmaticAssistant,
       miAgente // Nuevo agente
     }
   });
   ```

## 🎯 Mejores Prácticas

### Instrucciones del Agente
- **Claridad**: Define claramente el rol y propósito
- **Contexto**: Proporciona información sobre la plataforma
- **Comportamiento**: Especifica cómo debe interactuar
- **Limitaciones**: Indica qué NO debe hacer

### Configuración de Temperatura
- `0.0 - 0.3`: Respuestas determinísticas y consistentes
- `0.4 - 0.7`: Balance entre coherencia y creatividad
- `0.8 - 1.0`: Respuestas más creativas y variadas

### Naming Convention
- Usar camelCase para nombres de variables
- Nombres descriptivos que indiquen la función
- Sufijo "Agent" para claridad

## 📚 Tipos de Agentes Futuros

### 1. **searchSpecialistAgent**
Especializado en búsquedas complejas y filtrado avanzado.

### 2. **analysisAgent**
Enfocado en análisis comparativo y generación de insights.

### 3. **recommendationAgent**
Proporciona recomendaciones personalizadas basadas en preferencias.

### 4. **supportAgent**
Maneja consultas de soporte y problemas técnicos.

## 🔗 Recursos

- [Documentación de Mastra Agents](https://mastra.ai/docs/agents)
- [Guía de Prompts](https://platform.openai.com/docs/guides/prompt-engineering)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

**Última actualización**: Julio 2025