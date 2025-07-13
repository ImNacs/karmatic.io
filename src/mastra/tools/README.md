# 🔧 Herramientas (Tools) para Agentes

Este directorio contiene las herramientas que los agentes pueden usar para interactuar con sistemas externos.

## 📋 ¿Qué son las Tools?

Las herramientas son funciones que los agentes pueden invocar para:
- Acceder a APIs externas
- Consultar bases de datos
- Realizar cálculos complejos
- Interactuar con servicios de terceros

## 🛠️ Herramientas Planeadas

### 1. **searchAgenciesTool**
Busca agencias basándose en criterios específicos.

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";

export const searchAgenciesTool = createTool({
  id: "search-agencies",
  description: "Busca agencias automotrices por ubicación y criterios",
  inputSchema: z.object({
    location: z.string().describe("Ciudad o dirección"),
    radius: z.number().optional().describe("Radio en km"),
    services: z.array(z.string()).optional().describe("Servicios requeridos"),
    priceRange: z.enum(["$", "$$", "$$$"]).optional()
  }),
  outputSchema: z.object({
    agencies: z.array(z.object({
      id: z.string(),
      name: z.string(),
      address: z.string(),
      rating: z.number(),
      services: z.array(z.string())
    })),
    total: z.number()
  }),
  execute: async ({ location, radius = 10, services, priceRange }) => {
    // Lógica de búsqueda usando Supabase y Google Places
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      // Aplicar filtros...
      
    return {
      agencies: data || [],
      total: data?.length || 0
    };
  }
});
```

### 2. **getAgencyDetailsTool**
Obtiene información detallada de una agencia específica.

### 3. **compareAgenciesTool**
Compara múltiples agencias lado a lado.

### 4. **calculateDistanceTool**
Calcula distancias y tiempos de viaje.

### 5. **getReviewsTool**
Obtiene y analiza reseñas de agencias.

## 📝 Plantilla para Nueva Herramienta

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const miHerramientaTool = createTool({
  id: "mi-herramienta",
  description: "Descripción clara de qué hace la herramienta",
  
  // Schema de entrada - qué parámetros recibe
  inputSchema: z.object({
    parametro1: z.string().describe("Descripción del parámetro"),
    parametro2: z.number().optional().describe("Parámetro opcional")
  }),
  
  // Schema de salida - qué retorna
  outputSchema: z.object({
    resultado: z.string(),
    exito: z.boolean()
  }),
  
  // Función que ejecuta la lógica
  execute: async ({ parametro1, parametro2 }) => {
    try {
      // Lógica de la herramienta
      const resultado = await procesarAlgo(parametro1, parametro2);
      
      return {
        resultado,
        exito: true
      };
    } catch (error) {
      return {
        resultado: `Error: ${error.message}`,
        exito: false
      };
    }
  }
});
```

## 🎯 Mejores Prácticas

### Diseño de Tools
1. **Un propósito único**: Cada tool debe hacer una cosa bien
2. **Validación robusta**: Usar Zod para validar entrada/salida
3. **Manejo de errores**: Siempre manejar casos de error
4. **Documentación clara**: Describir qué hace y cómo usarla

### Naming Convention
- Usar sufijo "Tool" para claridad
- camelCase para nombres
- IDs en kebab-case

### Performance
- Implementar caché cuando sea apropiado
- Usar paginación para resultados grandes
- Timeouts para llamadas externas

## 🔗 Integración con Agentes

```typescript
// En la definición del agente
import { searchAgenciesTool } from "../tools/search-agencies-tool";

export const karmaticAssistant = new Agent({
  name: "Karmatic Assistant",
  // ... otras configuraciones
  tools: {
    searchAgencies: searchAgenciesTool,
    // Más herramientas...
  }
});
```

## 📚 Recursos

- [Mastra Tools Documentation](https://mastra.ai/docs/tools)
- [Zod Schema Validation](https://zod.dev)
- [Tool Calling Best Practices](https://platform.openai.com/docs/guides/function-calling)

---

**Última actualización**: Julio 2025