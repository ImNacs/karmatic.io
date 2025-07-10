# 📊 Agency Comparison - Sistema de Comparación de Agencias

## 🎯 Propósito

Esta feature permite a los usuarios comparar múltiples agencias lado a lado en una tabla interactiva. Es crucial para la toma de decisiones informadas al elegir dónde comprar o dar servicio a su vehículo.

## 🏗️ Arquitectura

```
agency-comparison/
├── AgencyComparison.tsx    # 🎯 Modal de comparación
├── components/             # 📁 Listo para subcomponentes
└── index.ts               # 📤 Exportaciones
```

## 🔍 Anatomía del Componente

### Props Interface

```typescript
interface AgencyComparisonProps {
  agencies: Agency[]           // Agencias a comparar (2-5)
  isOpen: boolean             // Control del modal
  onClose: () => void         // Callback al cerrar
  onStartAnalysis: () => void // Iniciar análisis profundo
}
```

### Secciones de Comparación

1. **Información General**
   - Nombre y ubicación
   - Rating y número de reseñas
   - Distancia desde búsqueda

2. **Métricas Clave**
   - Calificación promedio
   - Total de reseñas
   - Años en el mercado (si disponible)

3. **Características**
   - Horarios de operación
   - Servicios ofrecidos
   - Especialidades

4. **Acciones Rápidas**
   - Ver en mapa
   - Obtener direcciones
   - Llamar
   - Visitar sitio web

## 🎨 Diseño Visual

### 1. **Responsive Design**
- **Desktop**: Tabla horizontal con scroll
- **Mobile**: Cards apiladas con swipe
- **Tablet**: Diseño híbrido

### 2. **Visual Hierarchy**
```
🥇 Mejor valor (highlighted)
🥈 Segunda opción
🥉 Tercera opción
   Resto
```

### 3. **Indicadores Visuales**
- ✅ Ventajas sobre otras
- ⚠️ Puntos a considerar
- 🏆 Mejor en categoría

## 💡 Decisiones de Diseño

### 1. **¿Por qué un Modal?**
- **Foco**: Elimina distracciones
- **Contexto**: Mantiene el mapa de fondo
- **Flexibilidad**: Fácil abrir/cerrar

### 2. **¿Por qué máximo 5 agencias?**
- **Cognitivo**: Más de 5 es difícil de comparar
- **Visual**: Cabe en pantalla sin scroll excesivo
- **UX**: Paradoja de elección

### 3. **¿Por qué destacar el mejor?**
- **Decisión rápida**: Usuario promedio quiere recomendaciones
- **Pero...**: Mantiene neutralidad mostrando todos los datos

## 🔧 Componentes Internos (Por Implementar)

### 1. **ComparisonTable**
```typescript
<ComparisonTable
  agencies={agencies}
  metrics={['rating', 'reviews', 'distance']}
  onMetricClick={handleMetricSort}
/>
```

### 2. **MetricRow**
```typescript
<MetricRow
  metric="rating"
  values={agencies.map(a => a.rating)}
  highlight="highest"
/>
```

### 3. **AgencyCard** (Mobile)
```typescript
<AgencyCard
  agency={agency}
  comparisonData={comparisonResults}
  isWinner={agency.id === winnerId}
/>
```

## 🚀 Mejoras Potenciales

### 1. **Filtros Dinámicos**
```typescript
const [visibleMetrics, setVisibleMetrics] = useState([
  'rating', 'distance', 'price'
])

// Usuario puede toggle qué métricas ver
```

### 2. **Ponderación Personalizada**
```typescript
const weights = {
  rating: slider1Value,      // 40%
  distance: slider2Value,    // 30%
  price: slider3Value        // 30%
}

const calculateScore = (agency) => {
  return weights.rating * agency.rating + ...
}
```

### 3. **Exportar Comparación**
- PDF con tabla
- Compartir link
- Guardar para después

## 🎯 Flujo de Usuario

```mermaid
graph LR
    A[Seleccionar 2+ agencias] --> B[Click "Comparar"]
    B --> C[Modal abre]
    C --> D{Revisar datos}
    D -->|Decidió| E[Iniciar análisis]
    D -->|Necesita más info| F[Cerrar y buscar más]
    D -->|Ajustar selección| G[Volver al mapa]
```

## 💡 Tips del Mentor

### 1. **Datos vs Decisión**
No abrumes con datos. Muestra lo importante y permite profundizar si lo desean.

### 2. **Comparación Justa**
Normaliza métricas cuando sea posible:
- Rating: Ya está en escala 1-5
- Distancia: Podría mostrarse en tiempo (5 min vs 2.3 km)
- Precio: Índice relativo

### 3. **Accesibilidad**
- Usa `aria-label` en la tabla
- Permite navegación por teclado
- Lee ganador con screen reader

## 🐛 Consideraciones Técnicas

### 1. **Performance con Muchos Datos**
```typescript
// Memoizar cálculos costosos
const comparisonData = useMemo(() => 
  calculateComparison(agencies), [agencies]
)
```

### 2. **Sincronización de Estado**
El modal recibe agencias del padre. No duplicar estado internamente.

### 3. **Animaciones**
Modal usa Framer Motion. Mantener animaciones sutiles para no distraer del contenido.

## 📚 Recursos Adicionales

- [Comparison Table UX](https://www.nngroup.com/articles/comparison-tables/)
- [Modal Accessibility](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Data Visualization Best Practices](https://material.io/design/communication/data-visualization.html)

## 🎨 Mockup de Mejora

```
┌─────────────────────────────────────────┐
│  🆚 Comparación de Agencias             │
├─────────────────────────────────────────┤
│  Ordenar por: [Rating ▼] [Distancia] ... │
├─────────────────────────────────────────┤
│         │ 🏆 Auto Max │ Car Plus │ ... │
├─────────┼────────────┼───────────┼──────┤
│ ⭐ Rating│    4.8     │    4.2    │ ...  │
│ 📍 Dist. │   2.3 km   │   4.1 km  │ ...  │
│ 💰 Precio│    $$      │    $$$    │ ...  │
│ 🕐 Horario│  9-19 L-S  │  8-20 L-V │ ...  │
├─────────┴────────────┴───────────┴──────┤
│ [Ajustar pesos] [Exportar] [Analizar →] │
└─────────────────────────────────────────┘
```

---

💎 **Reflexión del Mentor**: La comparación es donde el usuario toma LA decisión. No es solo mostrar datos, es facilitar la elección. Piensa siempre: "¿Qué pregunta está tratando de responder el usuario?" y diseña para responderla claramente.