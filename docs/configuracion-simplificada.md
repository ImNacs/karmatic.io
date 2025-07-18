# Configuración Simplificada del Sistema

## Archivos de Configuración

### 1. `/src/lib/karmatic/filtering-criteria.json`
**Propósito**: Criterios de filtrado y validación (TODO lo relacionado con filtros)
- Tipos de negocio permitidos/prohibidos
- Keywords para detección (nombres, reseñas, dominios)
- Umbrales de análisis
- Sistema de scoring
- Features toggles

### 2. `/src/lib/karmatic/config.ts`
**Propósito**: Configuración operacional del sistema
- Parámetros de búsqueda (radio, idioma)
- Configuración del pipeline (timeouts, batches)
- Configuración de APIs
- Keywords básicas de respaldo

## Parámetros Clave

### Análisis de Reseñas
- **`minReviewsForAnalysis`**: 5 
  - Si tiene menos de 5 reseñas → NO se analiza contenido
  
- **`maxReviewsToAnalyze`**: 15
  - Si tiene 100 reseñas → Solo se analizan las 15 más relevantes

### Umbrales de Detección
- **`negativeReviewThreshold`**: 0.2 (20%)
  - Si 20% o más reseñas tienen keywords negativas → Se activa filtro
  
- **`fraudKeywordThreshold`**: 0.15 (15%)
  - Si 15% o más mencionan fraude → Penalización severa

- **`motorcycleKeywordThreshold`**: 0.3 (30%)
  - Si 30% o más mencionan motos → Se marca como negocio de motos

## Flujo de Validación

```
1. ¿Tiene al menos 5 reseñas?
   NO → Se incluye sin análisis de reseñas
   SÍ → Continuar
   
2. Tomar máximo 15 reseñas más relevantes

3. Analizar keywords en cada categoría

4. Calcular porcentajes y aplicar umbrales

5. Asignar score final (0-100)
```

## Prioridad de Configuración

1. **JSON tiene prioridad** sobre config.ts
2. **config.ts es respaldo** si falla carga del JSON
3. **Valores hardcoded son último recurso**

## Para Modificar Comportamiento

### Cambiar criterios de filtrado:
Editar `/src/lib/karmatic/filtering-criteria.json`

### Cambiar parámetros operacionales:
Editar `/src/lib/karmatic/config.ts`

### Activar/desactivar features:
En `filtering-criteria.json` → sección `features`:
- `includeMotorcycles`: false/true
- `expandSearchRadius`: false/true
- `validateWebsiteDomains`: true/false