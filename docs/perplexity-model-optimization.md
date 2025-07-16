# Optimización de Modelos Perplexity y OpenRouter

## Estrategia de Selección de Modelos

### APIs Disponibles

1. **Perplexity API**
   - Modelos especializados en búsquedas web
   - Acceso a información actualizada
   - Modelos: `sonar`, `sonar-pro`, `sonar-reasoning-pro`, `sonar-deep-research`

2. **OpenRouter API**
   - Acceso a modelos de múltiples proveedores
   - Incluye Kimi K2 (moonshot/moonshot-v1-32k)
   - Mejor para razonamiento complejo

### Selección Óptima por Tarea

| Tarea | Modelo Primario | Modelo Fallback | Justificación |
|-------|----------------|-----------------|---------------|
| **Análisis de Queries** | `moonshot/moonshot-v1-32k` (Kimi K2) | `sonar-reasoning-pro` | Requiere razonamiento complejo para extraer entidades |
| **Análisis Profundo** | `sonar-pro` | `sonar-pro` | Búsquedas web efectivas, costo-beneficio óptimo |
| **Análisis de Sentimientos** | `sonar` | `sonar` | Tarea simple, modelo básico suficiente |
| **Generación de FAQs** | `sonar-pro` | `sonar-pro` | Balance entre calidad y costo |

### Ventajas de Kimi K2 para Análisis de Queries

- **Ventana de contexto**: 32K tokens
- **Razonamiento**: Excelente para extraer entidades complejas
- **Costo**: Competitivo vs sonar-reasoning-pro
- **Precisión**: Mejor comprensión de consultas en español

### Implementación

```typescript
// Función que selecciona el modelo óptimo
export function getOptimalModel(task: string): string {
  switch (task) {
    case 'query_parsing':
      return isOpenRouterAvailable() 
        ? 'moonshot/moonshot-v1-32k'  // Kimi K2
        : 'sonar-reasoning-pro';       // Fallback
    
    case 'deep_analysis':
      return 'sonar-pro';             // Óptimo para búsquedas web
    
    case 'sentiment':
      return 'sonar';                 // Modelo básico suficiente
    
    case 'faq_generation':
      return 'sonar-pro';             // Balance calidad/costo
  }
}
```

### Configuración de Variables de Entorno

```bash
# Perplexity API
PERPLEXITY_API_KEY=your_perplexity_key

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_key
```

### Beneficios de la Optimización

1. **Costo Reducido**: Usar modelos básicos para tareas simples
2. **Mejor Precisión**: Kimi K2 para análisis complejo de queries
3. **Flexibilidad**: Fallback automático entre APIs
4. **Escalabilidad**: Fácil agregar nuevos modelos

### Próximos Pasos

1. Implementar caché para reducir llamadas repetitivas
2. Métricas de rendimiento por modelo
3. A/B testing para validar mejoras
4. Integración con más modelos de OpenRouter

## Funciones Actualizadas

### `parseComplexQuery()`
- **Modelo**: Kimi K2 (moonshot/moonshot-v1-32k)
- **Propósito**: Análisis complejo de consultas automotrices
- **Ventaja**: Mejor comprensión de entidades en español

### `analyzeAgencyDeep()`
- **Modelo**: sonar-pro
- **Propósito**: Búsquedas web para información de agencias
- **Ventaja**: Costo-beneficio óptimo

### `analyzeSentimentQuick()`
- **Modelo**: sonar
- **Propósito**: Análisis rápido de sentimientos
- **Ventaja**: Más económico para tarea simple

### `generateFAQFromReviews()`
- **Modelo**: sonar-pro
- **Propósito**: Generación de preguntas frecuentes
- **Ventaja**: Balance entre calidad y costo

## Métricas de Rendimiento Esperadas

- **Reducción de costos**: ~30% en análisis de sentimientos
- **Mejor precisión**: +15% en análisis de queries
- **Tiempo de respuesta**: Similar o mejor
- **Escalabilidad**: Soporte para más modelos