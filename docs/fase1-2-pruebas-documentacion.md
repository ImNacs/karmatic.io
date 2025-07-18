# Documentación de Pruebas - Fase 1.2

## 📋 Plan de Pruebas Punto a Punto

### 🧪 Pruebas de Componentes

#### 1. **Prueba de Transformación de Datos**
**Archivo**: `src/lib/karmatic/data-transformer.ts`

**Función**: `transformAnalysisResponseToStoredFormat()`
- [ ] ✅ Entrada: AnalysisResponse válida
- [ ] ✅ Salida: Formato compatible con BD
- [ ] ✅ Campos obligatorios presentes
- [ ] ✅ Trust data correctamente mapeado
- [ ] ✅ Reviews procesadas correctamente

**Función**: `transformStoredDataToAgency()`
- [ ] ✅ Entrada: Datos desde BD
- [ ] ✅ Salida: Interface Agency completa
- [ ] ✅ Compatibilidad con datos existentes
- [ ] ✅ Fallbacks para campos faltantes
- [ ] ✅ Trust indicators correctos

**Función**: `sortAgenciesByTrust()`
- [ ] ✅ Ordenamiento descendente por trust score
- [ ] ✅ Manejo de agencies sin trust score
- [ ] ✅ Preservación de otros campos

#### 2. **Prueba de Componentes Trust**
**Archivo**: `src/components/trust/TrustIndicator.tsx`

**Componente**: `TrustIndicator`
- [ ] ✅ Renderizado con todos los variants (full, badge, minimal)
- [ ] ✅ Colores correctos por trust level
- [ ] ✅ Tooltip con información detallada
- [ ] ✅ Contadores de red/green flags
- [ ] ✅ Responsividad en diferentes tamaños

**Componente**: `TrustBadge`
- [ ] ✅ Renderizado compacto
- [ ] ✅ Colores por trust level
- [ ] ✅ Iconos apropiados

**Componente**: `TrustScore`
- [ ] ✅ Renderizado solo score numérico
- [ ] ✅ Colores dinámicos basados en score
- [ ] ✅ Manejo de scores undefined

#### 3. **Prueba de Integración API**
**Archivo**: `src/app/page.tsx`

**Función**: `handleSearch()`
- [ ] ✅ Llamada a /api/analyze con parámetros correctos
- [ ] ✅ Transformación de respuesta
- [ ] ✅ Guardado en BD con metadata
- [ ] ✅ Navegación a explorer
- [ ] ✅ Manejo de errores específicos
- [ ] ✅ Estados de loading apropiados

#### 4. **Prueba de Renderizado**
**Archivo**: `src/app/explorer/[search_id]/ExplorerResultsMobile.tsx`

**Transformación de Datos**:
- [ ] ✅ Normalización de datos almacenados
- [ ] ✅ Transformación a Agency interface
- [ ] ✅ Ordenamiento por trust score
- [ ] ✅ Fallback a mock data

**Renderizado**:
- [ ] ✅ Trust indicators visibles
- [ ] ✅ Red/green flags mostrados
- [ ] ✅ Ordenamiento visible en UI
- [ ] ✅ Compatibilidad con datos existentes

## 🔧 Pruebas de Integración

### **Prueba 1: Flujo Completo de Búsqueda**
1. **Preparación**:
   - Servidor corriendo en localhost:3000
   - Variables de entorno configuradas
   - Base de datos accesible

2. **Ejecución**:
   - Ingresar ubicación válida
   - Ejecutar búsqueda
   - Verificar llamada a /api/analyze
   - Verificar transformación de datos
   - Verificar guardado en BD
   - Verificar navegación

3. **Validación**:
   - Datos correctos en BD
   - Trust scores calculados
   - Ordenamiento por confianza
   - Trust indicators visibles

### **Prueba 2: Compatibilidad con Datos Existentes**
1. **Preparación**:
   - Búsquedas existentes en BD sin trust data
   - Acceso a explorer con search_id existente

2. **Ejecución**:
   - Cargar búsqueda existente
   - Verificar renderizado sin errores
   - Verificar fallbacks funcionando

3. **Validación**:
   - No errores en consola
   - Datos existentes preservados
   - Trust indicators ocultos apropiadamente

### **Prueba 3: Manejo de Errores**
1. **Preparación**:
   - Simular fallo en /api/analyze
   - Simular fallo en guardado BD

2. **Ejecución**:
   - Ejecutar búsqueda con errores
   - Verificar fallbacks
   - Verificar mensajes de error

3. **Validación**:
   - Errores específicos mostrados
   - Usuario puede reintentar
   - No navegación en error

## 📊 Casos de Prueba Específicos

### **Caso 1: Agencia con Trust Score Alto**
```typescript
const mockHighTrustAgency = {
  id: 'test-1',
  name: 'AutoMax Premium',
  trustScore: 85,
  trustLevel: 'muy_alta',
  redFlags: [],
  greenFlags: [
    'Respuesta rápida a clientes',
    'Precios competitivos',
    'Documentación completa'
  ],
  reviews: [/* ... */]
}
```

**Expectativa**:
- Badge verde con "Muy Alta"
- Score 85 visible
- 3 green flags en tooltip
- Posición alta en ordenamiento

### **Caso 2: Agencia con Trust Score Bajo**
```typescript
const mockLowTrustAgency = {
  id: 'test-2',
  name: 'Autos Dudosos',
  trustScore: 25,
  trustLevel: 'muy_baja',
  redFlags: [
    'Precios muy por debajo del mercado',
    'Falta de documentación',
    'Quejas sobre cobros ocultos'
  ],
  greenFlags: [],
  reviews: [/* ... */]
}
```

**Expectativa**:
- Badge rojo con "Muy Baja"
- Score 25 visible
- 3 red flags en tooltip
- Posición baja en ordenamiento

### **Caso 3: Agencia sin Trust Data**
```typescript
const mockLegacyAgency = {
  id: 'test-3',
  name: 'Agencia Existente',
  rating: 4.2,
  reviewCount: 150,
  // Sin trust data
}
```

**Expectativa**:
- Sin trust indicators
- Ordenamiento por rating tradicional
- Funcionalidad normal preservada

## 🔍 Puntos de Validación Críticos

### **1. Validación de Datos**
- [ ] ✅ Todos los campos obligatorios presentes
- [ ] ✅ Tipos de datos correctos
- [ ] ✅ Valores dentro de rangos esperados
- [ ] ✅ Estructura de BD compatible

### **2. Validación de UI**
- [ ] ✅ Trust indicators renderizados correctamente
- [ ] ✅ Colores apropiados por nivel
- [ ] ✅ Tooltips informativos
- [ ] ✅ Responsividad en móvil/desktop

### **3. Validación de Performance**
- [ ] ✅ Tiempo de carga acceptable (< 3 seg after API)
- [ ] ✅ Sin memory leaks
- [ ] ✅ Smooth scrolling con ordenamiento
- [ ] ✅ Estados de loading apropiados

### **4. Validación de Compatibilidad**
- [ ] ✅ Datos existentes funcionan sin errores
- [ ] ✅ Fallbacks apropiados para campos faltantes
- [ ] ✅ No breaking changes en BD schema
- [ ] ✅ APIs existentes no afectadas

## 🧪 Comandos de Prueba

### **Pruebas Unitarias**
```bash
# Ejecutar pruebas de transformación
npm test -- --testPathPattern=data-transformer

# Ejecutar pruebas de componentes trust
npm test -- --testPathPattern=trust

# Ejecutar todas las pruebas
npm test
```

### **Pruebas de Integración**
```bash
# Verificar build sin errores
npm run build

# Verificar tipos TypeScript
npm run typecheck

# Verificar linting
npm run lint
```

### **Pruebas E2E**
```bash
# Iniciar servidor
npm run dev

# Ejecutar pruebas manuales:
# 1. Abrir localhost:3000
# 2. Realizar búsqueda
# 3. Verificar resultados
# 4. Verificar trust indicators
```

## 📝 Checklist de Validación

### **Pre-Pruebas**
- [ ] ✅ Servidor corriendo
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Base de datos accesible
- [ ] ✅ APIs externas funcionando

### **Durante Pruebas**
- [ ] ✅ Monitorear consola por errores
- [ ] ✅ Verificar network requests
- [ ] ✅ Validar datos en BD
- [ ] ✅ Confirmar comportamiento visual

### **Post-Pruebas**
- [ ] ✅ Documentar resultados
- [ ] ✅ Identificar issues
- [ ] ✅ Confirmar funcionalidad completa
- [ ] ✅ Validar performance

## 🚨 Casos de Error Conocidos

### **Error 1: /api/analyze no disponible**
**Síntoma**: Timeout en búsqueda
**Validación**: Fallback a búsqueda básica
**Expectativa**: Error específico mostrado

### **Error 2: Datos corruptos en BD**
**Síntoma**: Error en transformación
**Validación**: Normalización de datos
**Expectativa**: Fallbacks aplicados

### **Error 3: Trust score fuera de rango**
**Síntoma**: Colores incorrectos
**Validación**: Validación de rangos
**Expectativa**: Colores por defecto

### **Error 4: Componente trust sin datos**
**Síntoma**: Componente vacío
**Validación**: Conditional rendering
**Expectativa**: Componente no renderizado

## 📊 Métricas de Éxito

### **Funcionalidad**
- ✅ 100% de transformaciones exitosas
- ✅ 0 errores en renderizado
- ✅ Trust indicators visibles cuando hay datos
- ✅ Ordenamiento funcionando correctamente

### **Performance**
- ✅ < 3 segundos carga después de API
- ✅ < 500ms para transformaciones
- ✅ Smooth scrolling con 100+ agencias
- ✅ Memory usage stable

### **Compatibilidad**
- ✅ Datos existentes preservados
- ✅ 0 breaking changes
- ✅ Fallbacks funcionando
- ✅ Mobile/desktop responsive

**Las pruebas están diseñadas para validar cada punto de integración y asegurar que el Core Trust Engine funcione correctamente con el sistema existente.**