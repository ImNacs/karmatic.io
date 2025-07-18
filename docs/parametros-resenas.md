# Aclaración: Parámetros de Análisis de Reseñas

## Los Dos Parámetros

### 1. `minReviewsForAnalysis` = 5
- **Ubicación**: `filtering-criteria.json`
- **Propósito**: Umbral mínimo para decidir SI hacer análisis
- **Lógica**: 
  - < 5 reseñas = NO analizar (no hay suficiente data)
  - >= 5 reseñas = SÍ analizar

### 2. `reviewsToAnalyze` = 15 (o `maxReviewsToAnalyze`)
- **Ubicación**: `config.ts` (migrado a `filtering-criteria.json`)
- **Propósito**: Límite máximo de cuántas analizar
- **Lógica**:
  - Si hay 100 reseñas, solo analizar las 15 más relevantes
  - Optimización de performance

## Ejemplos

| Agencia | Total Reseñas | ¿Se Analiza? | ¿Cuántas? |
|---------|---------------|--------------|-----------|
| A       | 3             | NO           | 0         |
| B       | 5             | SÍ          | 5         |
| C       | 10            | SÍ          | 10        |
| D       | 50            | SÍ          | 15 (max)  |
| E       | 100           | SÍ          | 15 (max)  |

## Flujo

```
if (totalReviews < minReviewsForAnalysis) {
    // NO analizar - no hay suficientes
    return;
}

// SÍ analizar - tomar las más relevantes
const toAnalyze = Math.min(totalReviews, reviewsToAnalyze);
```

## ¿Por qué dos parámetros?

1. **Confiabilidad**: Necesitas mínimo 5 reseñas para que el análisis sea estadísticamente relevante
2. **Performance**: No necesitas analizar 1000 reseñas, con 15 bien seleccionadas es suficiente