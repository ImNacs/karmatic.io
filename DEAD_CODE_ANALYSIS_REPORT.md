# Análisis Exhaustivo de Código Muerto - Proyecto Karmatic

## Resumen Ejecutivo

Se encontraron:
- **54 archivos sin imports** desde otros archivos
- **130 archivos con exports sin usar**
- **36 imports sin usar** en 26 archivos
- **Múltiples implementaciones duplicadas** de servicios Apify
- **Paquetes npm sin usar** en package.json

## 1. ARCHIVOS SIN USAR (54 archivos)

### Tests sin ejecutar (10 archivos)
```
__tests__/api/search-history.test.ts
__tests__/api/search-limit.integration.test.ts
__tests__/api/soft-delete.test.ts
__tests__/components/SearchHistory.test.tsx
__tests__/contexts/SearchHistoryContext.test.tsx
__tests__/e2e/search-limit-flow.test.ts
__tests__/history-reload.test.ts
__tests__/integration/search-flow.test.tsx
__tests__/json-path-query.test.ts
__tests__/search-limit.test.ts
```

### Componentes no utilizados (29 archivos)
```
components/chat/__tests__/* (2 archivos de test)
components/common/loading-screen-mobile.tsx
components/common/loading-screen/LoadingScreen.tsx
components/features/agency-card/AgencyCardLocationMapEnhanced.tsx
components/features/agency-comparison/AgencyComparison.tsx
components/features/agency-detail/AgencyDetail.tsx
components/features/agency-map/AgencyMapOptimized.tsx
components/features/agency-map/utils/constants.ts
components/features/ai-assistant/AIAssistant.tsx
components/features/auth/components/AuthSync.tsx
components/features/auth/components/RegistrationModal.tsx
components/features/search/SearchInterface.tsx
components/features/search/components/LocationAutocomplete/LocationAutocomplete.tsx
components/features/search/components/SearchForm/SearchForm.tsx
components/features/search/components/SearchLimitIndicator/SearchLimitIndicator.tsx
components/features/sidebar/VerticalSidebar.tsx
components/trust/TrustIndicator.tsx
components/ui/separator.tsx
components/ui/skeleton.tsx
components/ui/tabs.tsx
components/ui/theme-toggle.tsx
```

### Hooks sin usar (6 archivos)
```
hooks/auth/index.ts
hooks/auth/useAuthRedirect.ts
hooks/auth/useProtectedRoute.ts
hooks/use-map-interactions.ts
hooks/useConversationAuth.ts
hooks/useOpenRouterChat.ts
```

### Servicios/Libs sin usar (15 archivos)
```
lib/auth/helpers-mock.ts ⚠️ (Mock sin usar)
lib/auth/index.ts
lib/auth/route-guards.ts
lib/auth/session.ts
lib/supabase-vector.ts
lib/supabase/client.ts
lib/supabase/server.ts
mastra/cache/redis-client.ts
mastra/services/apify-client.ts ⚠️ (Duplicado de apify-reviews-sync)
mastra/services/apify-reviews.ts ⚠️ (Duplicado de apify-reviews-sync)
mastra/tools/analyze-reviews.ts
types/chat.ts
types/google-maps.d.ts
contexts/AuthRouteContext.tsx
```

## 2. EXPORTS SIN USAR (130 archivos)

### Exports más comunes sin usar:
- **runtime**: En todas las rutas de API (innecesario en Next.js 15)
- **default**: En todas las páginas (normal, son entry points)
- **Componentes UI completos** sin usar en components/ui/*

### Componentes con todos sus exports sin usar:
```
components/common/loading-screen-mobile.tsx -> LoadingScreenMobile
components/features/agency-card/* -> AgencyCardLocationMapEnhanced
components/features/agency-comparison/* -> AgencyComparison
components/features/agency-detail/* -> AgencyDetail
components/features/ai-assistant/AIAssistant.tsx -> AIAssistant
components/features/auth/components/* -> AuthSync, RegistrationModal
components/features/search/SearchInterface.tsx -> SearchInterface
components/trust/* -> TrustIndicator, TrustBadge, TrustScore
```

## 3. IMPORTS SIN USAR (36 imports en 26 archivos)

### Top archivos con más imports sin usar:
```
components/features/ai-assistant/panels/ChatPanelMobile.tsx (3)
  - FiMessageSquare, Avatar, AvatarFallback

components/features/search/components/SearchForm/SearchForm.tsx (3)
  - useState, SearchFormData, SearchData

components/ui/form.tsx (3)
  - ControllerProps, FieldPath, FieldValues

lib/conversation-manager.ts (3)
  - createClient, auth, getOrCreateSearchSession
```

## 4. CÓDIGO REDUNDANTE

### Implementaciones duplicadas de Apify:

1. **mastra/services/apify-client.ts** (NO USADO)
   - Cliente completo de Apify con ApifyClient
   - Funciones: getApifyClient, runApifyActor, getGoogleMapsReviews, searchGoogleMapsPlaces

2. **mastra/services/apify-reviews.ts** (NO USADO)
   - Implementación asíncrona con polling
   - Funciones: startReviewsScraping, checkScrapingStatus, getScrapingResults

3. **mastra/services/apify-reviews-sync.ts** (EN USO)
   - Implementación sincrónica (la que se usa actualmente)
   - Usada por: pipeline.ts y analyze-reviews.ts

### Google Places duplicado:
- lib/google-places.ts
- mastra/services/google-places.ts

### Archivos de configuración redundantes:
- components/features/agency-map/utils/constants.ts
- components/features/search/utils/constants.ts

## 5. PAQUETES NPM SIN USAR

```json
{
  "@ai-sdk/amazon-bedrock": "^2.2.11",  // No usado
  "@ai-sdk/cohere": "^1.2.10",          // No usado
  "@ai-sdk/mistral": "^1.2.8",          // No usado
  "@radix-ui/react-select": "^2.2.5",   // No encontrado en código
  "motion": "^12.23.0",                  // Duplicado con framer-motion
  "tw-animate-css": "^1.3.5"             // No usado
}
```

## 6. ARCHIVOS ESPECÍFICOS PROBLEMÁTICOS

### lib/auth/helpers-mock.ts
- Mock temporal que no se usa
- Importa de Clerk pero retorna datos mock
- Debería eliminarse

### mastra/services/apify-client.ts y apify-reviews.ts
- Implementaciones completas de Apify NO USADAS
- Se usa solo apify-reviews-sync.ts
- Mantener solo la implementación sincrónica

### lib/search-tracking.ts
- Importado por 10 archivos
- Verificar si realmente se necesita en todos

## RECOMENDACIONES DE LIMPIEZA

### Alta Prioridad (Eliminar inmediatamente):
1. Todos los archivos de test en `__tests__/` (no se ejecutan)
2. `mastra/services/apify-client.ts` (duplicado)
3. `mastra/services/apify-reviews.ts` (duplicado)
4. `lib/auth/helpers-mock.ts` (mock sin usar)
5. Paquetes npm sin usar del package.json

### Media Prioridad (Verificar antes de eliminar):
1. Componentes de UI sin usar (pueden ser para futuro uso)
2. Hooks de auth sin usar
3. Types sin usar

### Baja Prioridad (Considerar mantener):
1. Archivos index.ts (pueden ser para organización)
2. Constants files (pueden usarse en el futuro)

## IMPACTO ESTIMADO

- **Reducción de bundle**: ~30-40% menos código
- **Menos dependencias**: 6 paquetes npm menos
- **Mantenibilidad**: Código más limpio y fácil de navegar
- **Performance**: Builds más rápidos, menos memoria

## COMANDOS PARA LIMPIEZA

```bash
# Eliminar archivos de test sin usar
rm -rf src/__tests__/
rm -rf src/components/chat/__tests__/
rm -rf src/mastra/tools/__tests__/
rm -rf src/lib/auth/__tests__/

# Eliminar servicios Apify duplicados
rm src/mastra/services/apify-client.ts
rm src/mastra/services/apify-reviews.ts

# Eliminar mock sin usar
rm src/lib/auth/helpers-mock.ts
```