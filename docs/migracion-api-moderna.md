# Migración a API Moderna de Google Places

## Cambios Realizados

### 1. Eliminación de API Legacy
- **Eliminado**: `/src/lib/apis/google-places.ts` (versión legacy)
- **Renombrado**: `google-places-modern.ts` → `google-places.ts`
- **Motivo**: Simplificar y usar solo Text Search API que es más precisa

### 2. Simplificación de Configuración
**Antes**:
```typescript
search: {
  useModernAPI: true,  // Ya no necesario
  // ...
}
```

**Después**:
```typescript
search: {
  radiusMeters: 5000,
  language: 'es-MX',
  searchQuery: 'agencias de autos...'
}
```

### 3. Actualización de Imports
**Antes**:
```typescript
import { searchNearbyAgencies } from '../apis/google-places';
import { searchAgenciesModern } from '../apis/google-places-modern';
```

**Después**:
```typescript
import { searchAgencies } from '../apis/google-places';
```

### 4. Simplificación del Pipeline
**Antes**:
```typescript
if (ANALYSIS_CONFIG.search.useModernAPI) {
  nearbyAgencies = await searchAgenciesModern(...);
} else {
  nearbyAgencies = await searchNearbyAgencies(...);
}
```

**Después**:
```typescript
// Solo una forma de buscar
nearbyAgencies = await searchAgencies(...);
```

## Ventajas de la Migración

1. **Código más simple** - Sin lógica condicional
2. **Una sola API** - Text Search es más precisa
3. **Menos mantenimiento** - Un solo archivo
4. **Búsquedas contextuales** - Mejor interpretación de queries
5. **Sin legacy** - Código moderno y limpio

## API Text Search vs Nearby Search

| Feature | Text Search ✅ | Nearby Search ❌ |
|---------|---------------|-----------------|
| Query contextual | SÍ | NO |
| Entiende "agencia de autos" | SÍ | NO |
| Requiere types específicos | NO | SÍ |
| Resultados relevantes | Excelente | Regular |
| Manejo de idiomas | Mejor | Básico |

## Funciones Disponibles

### `searchAgencies(location, query?, radius?)`
Busca agencias con query inteligente

**Parámetros**:
- `location`: { lat, lng }
- `query`: string opcional (usa default si no se provee)
- `radius`: número en metros (default: 5000)

**Ejemplo**:
```typescript
const agencies = await searchAgencies(
  { lat: 19.4326, lng: -99.1332 },
  "Toyota seminuevos",
  10000
);
```

## Notas

- La API Text Search es más cara pero más precisa
- Los resultados vienen ordenados por relevancia
- No es necesario especificar types
- Maneja mejor las búsquedas en español