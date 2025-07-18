# Mapeo de Puntos de Integración - Fase 1.2

## 🔍 Análisis de Componentes de Resultados

### 📱 ExplorerResultsMobile

#### **Ubicación**: `/src/app/explorer/[search_id]/ExplorerResultsMobile.tsx`
- **Función**: Componente principal de resultados de búsqueda
- **Estado actual**: Usa mock data (líneas 63-122) y transforma datos de API (líneas 125-149)
- **Datos**: Recibe `agencies: any[]` como prop

#### **Transformación Actual de Datos** (líneas 125-149)
```typescript
const agencies: Agency[] = initialAgencies.length > 0 
  ? initialAgencies.map((agency: any) => ({
      id: agency.id,
      name: agency.name,
      rating: agency.rating || 0,
      reviewCount: agency.userRatingsTotal || 0,
      address: agency.address,
      phone: agency.phoneNumber || '',
      hours: agency.openingHours?.[0] || 'No disponible',
      distance: agency.distance || '',
      coordinates: { lat: agency.latitude, lng: agency.longitude },
      isHighRated: (agency.rating || 0) >= 4.0,
      specialties: [],
      website: agency.website,
      description: '',
      images: [],
      recentReviews: agency.reviews?.slice(0, 3).map((review: any, index: number) => ({
        id: review.time?.toString() || `review-${agency.id}-${index}`,
        author: review.author_name,
        rating: review.rating,
        comment: review.text,
        date: review.relative_time_description
      })) || [],
      placeId: agency.placeId,
      openingHours: agency.openingHours,
    }))
  : mockAgencies // Fallback a mock data
```

## 🔗 Puntos de Integración Críticos

### 1. **Punto Principal de Búsqueda**
- **Archivo**: `/src/app/page.tsx`
- **Línea**: 76
- **Función**: `handleSearch()`
- **Cambio necesario**: Reemplazar mock con llamada a `/api/analyze`

### 2. **Transformación de Datos**
- **Archivo**: `/src/app/explorer/[search_id]/ExplorerResultsMobile.tsx`
- **Líneas**: 125-149
- **Función**: Transformar datos de API a interface `Agency`
- **Cambio necesario**: Actualizar mapping para incluir trust data

### 3. **Persistencia de Datos**
- **Archivo**: `/src/app/page.tsx`
- **Líneas**: 84-102
- **Función**: Guardar resultados en BD
- **Cambio necesario**: Guardar estructura de datos actualizada

### 4. **Recuperación de Datos**
- **Archivo**: `/src/app/explorer/[search_id]/page.tsx`
- **Líneas**: 23-24
- **Función**: Cargar datos desde BD
- **Cambio necesario**: Manejar nueva estructura de datos

## 🔄 Flujo de Datos Completo

### **Flujo Actual**
```
1. SearchInterface → handleSearch() → Mock delay (2s)
2. Save mock data → DB (resultsJson)
3. Navigate → /explorer/[searchId]
4. Load from DB → ExplorerResultsMobile
5. Transform API data → Agency[] (si hay datos reales)
6. Fallback → mockAgencies (si no hay datos)
```

### **Flujo Necesario**
```
1. SearchInterface → handleSearch() → /api/analyze (2-3 min)
2. Transform AnalysisResponse → Agency[] (nueva función)
3. Save trust data → DB (resultsJson con trust data)
4. Navigate → /explorer/[searchId]
5. Load from DB → ExplorerResultsMobile
6. Render trust data → Trust indicators y badges
```

## 📊 Estructura de Datos Necesaria

### **Datos Actuales en BD**
```typescript
interface StoredSearchResult {
  searchId: string
  location: string
  query: string | null
  resultsJson: {
    agencies: Array<{
      id: string
      name: string
      rating: number
      userRatingsTotal: number
      address: string
      phoneNumber?: string
      // ... más campos básicos
    }>
  }
}
```

### **Datos Necesarios en BD**
```typescript
interface StoredSearchResult {
  searchId: string
  location: string
  query: string | null
  resultsJson: {
    agencies: Array<{
      // Datos básicos (existentes)
      id: string
      name: string
      rating: number
      userRatingsTotal: number
      address: string
      phoneNumber?: string
      
      // NUEVOS: Trust analysis data
      trustScore?: number
      trustLevel?: 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja'
      redFlags?: string[]
      greenFlags?: string[]
      reviewsAnalyzed?: number
      
      // NUEVOS: Deep analysis data
      deepAnalysis?: {
        inventoryUrl?: string
        socialMedia?: {
          facebook?: string
          instagram?: string
          website?: string
        }
        recentNews?: string[]
        additionalInfo?: string
      }
    }>
    
    // NUEVOS: Metadata del análisis
    analysisMetadata?: {
      executionTimeMs: number
      totalAgenciesFound: number
      totalProcessed: number
      totalWithReviews: number
      totalWithDeepAnalysis: number
      errors: string[]
    }
  }
}
```

## 🎯 Transformaciones Necesarias

### **Función de Transformación Principal**
```typescript
// NUEVA función necesaria
function transformAnalysisResponseToStoredFormat(
  analysisResponse: AnalysisResponse
): StoredSearchResult['resultsJson'] {
  return {
    agencies: analysisResponse.agencies.map(result => ({
      // Datos básicos de Google Places
      id: result.agency.placeId,
      name: result.agency.name,
      rating: result.agency.rating,
      userRatingsTotal: result.reviewsCount,
      address: result.agency.address,
      phoneNumber: result.agency.phone,
      latitude: result.agency.location.lat,
      longitude: result.agency.location.lng,
      
      // NUEVOS: Trust data
      trustScore: result.trustAnalysis.trustScore,
      trustLevel: result.trustAnalysis.trustLevel,
      redFlags: result.trustAnalysis.redFlags,
      greenFlags: result.trustAnalysis.greenFlags,
      reviewsAnalyzed: result.reviewsCount,
      
      // NUEVOS: Deep analysis
      deepAnalysis: result.deepAnalysis,
      
      // Reviews procesadas
      reviews: result.reviews.map(review => ({
        author_name: review.author,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relativeTimeDescription
      }))
    })),
    
    // NUEVOS: Metadata
    analysisMetadata: analysisResponse.metadata
  }
}
```

### **Función de Transformación para UI**
```typescript
// ACTUALIZAR función existente (líneas 125-149)
function transformStoredDataToAgency(storedAgency: any): Agency {
  return {
    // Datos básicos (existentes)
    id: storedAgency.id,
    name: storedAgency.name,
    rating: storedAgency.rating || 0,
    reviewCount: storedAgency.userRatingsTotal || 0,
    address: storedAgency.address,
    phone: storedAgency.phoneNumber || '',
    hours: storedAgency.openingHours?.[0] || 'No disponible',
    distance: storedAgency.distance || '',
    coordinates: { 
      lat: storedAgency.latitude, 
      lng: storedAgency.longitude 
    },
    isHighRated: (storedAgency.rating || 0) >= 4.0,
    specialties: [],
    website: storedAgency.website,
    description: '',
    images: [],
    recentReviews: storedAgency.reviews?.slice(0, 3).map((review: any, index: number) => ({
      id: review.time?.toString() || `review-${storedAgency.id}-${index}`,
      author: review.author_name,
      rating: review.rating,
      comment: review.text,
      date: review.relative_time_description
    })) || [],
    placeId: storedAgency.placeId,
    openingHours: storedAgency.openingHours,
    
    // NUEVOS: Trust data
    trustScore: storedAgency.trustScore,
    trustLevel: storedAgency.trustLevel,
    redFlags: storedAgency.redFlags,
    greenFlags: storedAgency.greenFlags,
    deepAnalysis: storedAgency.deepAnalysis
  }
}
```

## 🔧 Archivos que Necesitan Modificación

### **Crear Nuevos**
1. `src/lib/karmatic/data-transformer.ts`
   - `transformAnalysisResponseToStoredFormat()`
   - `transformStoredDataToAgency()`

2. `src/components/trust/TrustIndicator.tsx`
   - Componente para mostrar trust score

3. `src/components/trust/TrustBadge.tsx`
   - Badge de nivel de confianza

### **Modificar Existentes**
1. `src/app/page.tsx`
   - Línea 76: Reemplazar mock con `/api/analyze`
   - Líneas 84-102: Guardar datos de trust analysis

2. `src/types/agency.ts`
   - Extender interface `Agency` con trust properties

3. `src/app/explorer/[search_id]/ExplorerResultsMobile.tsx`
   - Líneas 125-149: Actualizar transformación de datos
   - Añadir renderizado de trust indicators

4. `src/app/explorer/[search_id]/page.tsx`
   - Líneas 23-24: Manejar nueva estructura de datos

## 🎯 Orden de Implementación

### **Fase 1: Preparación**
1. Crear `data-transformer.ts` con funciones de transformación
2. Extender types en `agency.ts`
3. Crear componentes básicos de trust

### **Fase 2: Integración Backend**
1. Actualizar `handleSearch()` en `page.tsx`
2. Modificar guardado de datos en BD
3. Actualizar carga de datos en explorer

### **Fase 3: Integración Frontend**
1. Actualizar transformación en `ExplorerResultsMobile`
2. Añadir renderizado de trust indicators
3. Implementar ordenamiento por confianza

### **Fase 4: Pruebas**
1. Pruebas punto a punto de cada transformación
2. Pruebas E2E del flujo completo
3. Validación de datos en BD

## 📊 Compatibilidad y Fallbacks

### **Compatibilidad con Datos Existentes**
```typescript
// Manejar datos existentes sin trust data
const agencies = storedAgencies.map(agency => ({
  ...transformStoredDataToAgency(agency),
  // Fallbacks para datos faltantes
  trustScore: agency.trustScore ?? undefined,
  trustLevel: agency.trustLevel ?? undefined,
  redFlags: agency.redFlags ?? [],
  greenFlags: agency.greenFlags ?? []
}))
```

### **Fallbacks para Errores**
```typescript
// En caso de error en /api/analyze
try {
  const analysisResponse = await fetch('/api/analyze', {...})
  const analysisData = await analysisResponse.json()
  searchResults = transformAnalysisResponseToStoredFormat(analysisData)
} catch (error) {
  // Fallback a búsqueda básica sin análisis
  searchResults = await performBasicSearch(data)
}
```

## 🔍 Puntos de Validación

### **Validación de Datos**
1. ✅ Verificar que `/api/analyze` responde correctamente
2. ✅ Validar transformación de AnalysisResponse → StoredFormat
3. ✅ Validar transformación de StoredFormat → Agency
4. ✅ Verificar que UI renderiza trust data correctamente

### **Validación de Performance**
1. ✅ Medir tiempo de respuesta de `/api/analyze`
2. ✅ Verificar que loading states funcionan correctamente
3. ✅ Validar que no hay memory leaks
4. ✅ Confirmar que fallbacks funcionan

### **Validación de UX**
1. ✅ Verificar que trust indicators son comprensibles
2. ✅ Validar que ordenamiento por confianza es útil
3. ✅ Confirmar que red/green flags aportan valor
4. ✅ Validar que estados de error son claros

**Los puntos de integración están claramente identificados y el plan de transformación es compatible con la estructura existente.**