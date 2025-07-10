# 🎴 Agency Card - Interfaz de Tarjetas Deslizables

## 🎯 Propósito

Esta feature proporciona una experiencia móvil optimizada para navegar entre agencias usando tarjetas deslizables (estilo Tinder). Es la alternativa móvil a hacer clic en marcadores pequeños en un mapa.

## 🏗️ Arquitectura

```
agency-card/
├── AgencyCardLocationMapEnhanced.tsx  # 🎯 Componente monolítico (616 líneas)
├── components/                        # 📁 Carpeta lista para refactorización
└── index.ts                          # 📤 Exportaciones
```

## 📱 Características Principales

### 1. **Gestos Táctiles**
- **Swipe horizontal**: Navegar entre agencias
- **Swipe vertical**: Cerrar el componente
- **Tap**: Expandir/contraer información

### 2. **Animaciones con Framer Motion**
- Transiciones suaves entre tarjetas
- Efectos de resorte en los swipes
- Indicadores visuales de dirección

### 3. **Información Mostrada**
- Datos básicos: Nombre, rating, dirección
- Horario del día actual
- Reseñas recientes
- Acciones: Seleccionar, direcciones, llamar

## 🔍 Análisis del Código

### Estados Principales

```typescript
const [currentIndex, setCurrentIndex] = useState(currentAgencyIndex)
const [isExpanded, setIsExpanded] = useState(false)
const [direction, setDirection] = useState<'left' | 'right' | null>(null)
const [selectedTab, setSelectedTab] = useState<'info' | 'reviews'>('info')
```

### Lógica de Swipe

El componente usa `framer-motion` para detectar gestos:

```typescript
const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
  const swipe = Math.abs(offset.x) * velocity.x
  
  if (swipe < -swipeConfidenceThreshold) {
    paginate(1)  // Siguiente
  } else if (swipe > swipeConfidenceThreshold) {
    paginate(-1) // Anterior
  }
}
```

**Lección del Mentor**: El "swipe confidence threshold" combina distancia Y velocidad. Esto hace que tanto swipes largos lentos como cortos rápidos funcionen.

### Componentes Internos

1. **NavigationDots**: Indicadores de posición
2. **ReviewCard**: Tarjeta individual de reseña
3. **InfoTab**: Pestaña de información general
4. **ReviewsTab**: Pestaña de reseñas

## 🎨 Patrones de UX Móvil

### 1. **Bottom Sheet Pattern**
- La tarjeta aparece desde abajo
- Se puede cerrar deslizando hacia abajo
- Altura adaptativa según contenido

### 2. **Progressive Disclosure**
- Información básica visible siempre
- Detalles en pestañas expandibles
- Reseñas bajo demanda

### 3. **Touch Feedback**
- Botones con estados hover/active
- Animaciones que responden a la velocidad del gesto
- Indicadores visuales de límites (primera/última tarjeta)

## 🚧 Oportunidades de Mejora

### 1. **Refactorización Necesaria**
El componente tiene 600+ líneas. Debería dividirse en:
- `AgencyCard.tsx` - Tarjeta individual
- `NavigationControls.tsx` - Dots y flechas
- `SwipeContainer.tsx` - Lógica de gestos
- `InfoTabs.tsx` - Sistema de pestañas

### 2. **Performance**
- Implementar `React.memo` en ReviewCard
- Lazy loading de reseñas
- Virtualización si hay muchas agencias

### 3. **Accesibilidad**
- Agregar navegación por teclado
- Mejorar labels ARIA
- Alternativas a swipe para usuarios con discapacidad

## 💡 Tips del Mentor

### 1. **Gestos vs Botones**
Siempre proporciona ambos. Los gestos son descubribles, los botones son obvios.

### 2. **Animaciones con Propósito**
Cada animación aquí comunica algo:
- Dirección del swipe → qué agencia viene
- Velocidad → respuesta a la intención del usuario
- Rebote → límites alcanzados

### 3. **Estado Sincronizado**
Nota cómo `currentIndex` se sincroniza con `currentAgencyIndex` (prop). Esto permite control externo mientras mantiene estado interno.

## 🔧 Cómo Extender

### Agregar nueva acción:
1. Añadir botón en la sección de acciones
2. Implementar handler
3. Emitir evento al padre si necesario

### Personalizar animaciones:
```typescript
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
}
```

### Cambiar threshold de swipe:
Busca `swipeConfidenceThreshold` y ajusta el valor (default: 10000).

## 🎯 Casos de Uso

1. **Búsqueda en móvil**: Usuario busca → ve mapa → toca área → aparecen tarjetas
2. **Exploración rápida**: Swipe para ver opciones rápidamente
3. **Comparación visual**: Ver fotos y ratings lado a lado

## 🐛 Consideraciones Técnicas

### 1. **Memory Leaks**
El componente usa `useEffect` para sincronizar índices. Asegúrate de limpiar listeners.

### 2. **Reconciliación de React**
Usa `key={currentIndex}` en AnimatePresence para forzar remount.

### 3. **Touch vs Mouse**
El componente funciona con ambos gracias a Framer Motion's unified events.

## 📚 Para Profundizar

- [Framer Motion Gestures](https://www.framer.com/motion/gestures/)
- [Mobile UX Patterns](https://www.uxpin.com/studio/blog/mobile-design-patterns/)
- [React Performance](https://react.dev/reference/react/memo)

---

💎 **Reflexión del Mentor**: Este componente es un ejemplo perfecto de "UX > Código Limpio". Aunque necesita refactorización, la experiencia de usuario es excelente. A veces está bien tener deuda técnica si el valor para el usuario es alto. Pero no olvides pagarla eventualmente.