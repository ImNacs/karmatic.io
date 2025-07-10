# 🧭 Sidebar - Navegación Principal y Centro de Control

## 🎯 Propósito

Esta feature es el hub central de navegación y control de usuario. Proporciona acceso rápido a todas las funciones principales, gestión de cuenta, preferencias y sirve como identidad visual constante de la aplicación.

## 🏗️ Arquitectura

```
sidebar/
├── VerticalSidebar.tsx    # 🎯 Componente principal
├── components/           # 📁 Subcomponentes (por implementar)
└── index.ts             # 📤 Exportaciones
```

## 🔍 Anatomía del Componente

### Secciones Principales

1. **Header/Logo**
   - Logo de KarMatic
   - Versión (Beta/Pro)
   - Estado de conexión

2. **Perfil de Usuario**
   - Avatar (Clerk integration)
   - Nombre y email
   - Plan actual
   - Acceso rápido a cuenta

3. **Navegación Principal**
   - Nueva búsqueda
   - Historial
   - Favoritos
   - Análisis guardados

4. **Herramientas**
   - Comparador
   - Chat IA
   - Exportar datos

5. **Footer**
   - Tema (claro/oscuro)
   - Ayuda
   - Configuración
   - Cerrar sesión

## 🎨 Estados y Comportamiento

### 1. **Responsive Design**
```typescript
// Desktop (>1024px)
- Sidebar fijo de 256px
- Siempre visible
- Contenido completo

// Tablet (768-1024px)  
- Colapsable a iconos
- Tooltip en hover
- Toggle button

// Mobile (<768px)
- Drawer deslizable
- Overlay oscuro
- Gesture para cerrar
```

### 2. **Estados de Usuario**
```typescript
interface UserState {
  isAuthenticated: boolean
  isPro: boolean
  searchesRemaining?: number
  plan: 'free' | 'basic' | 'pro'
}
```

### 3. **Navegación Activa**
```typescript
const navItems = [
  { 
    id: 'search',
    label: 'Nueva búsqueda',
    icon: FiSearch,
    path: '/',
    shortcut: 'Cmd+K'
  },
  // ...más items
]

// Resaltar item activo
const isActive = pathname === item.path
```

## 💡 Componentes Internos (Por Extraer)

### 1. **UserProfile**
```typescript
<UserProfile
  user={user}
  onManageAccount={() => {}}
  onUpgrade={() => {}}
/>
```

### 2. **NavigationMenu**
```typescript
<NavigationMenu
  items={navItems}
  activeItem={currentPath}
  collapsed={isCollapsed}
  onNavigate={handleNavigate}
/>
```

### 3. **ThemeToggle**
```typescript
<ThemeToggle
  theme={theme}
  onChange={setTheme}
  showLabel={!isCollapsed}
/>
```

### 4. **QuickActions**
```typescript
<QuickActions>
  <QuickAction 
    icon={FiMessageSquare} 
    label="Chat IA"
    badge="Nuevo"
    onClick={openChat}
  />
</QuickActions>
```

## 🚀 Features Avanzadas

### 1. **Shortcuts de Teclado**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch(e.key) {
        case 'k': openSearch(); break;
        case 'h': openHistory(); break;
        case '/': openHelp(); break;
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

### 2. **Notificaciones**
```typescript
<NotificationBadge count={unreadCount}>
  <FiBell />
</NotificationBadge>

// Tipos de notificaciones
- Análisis completado
- Nueva feature disponible
- Límite de búsquedas cerca
```

### 3. **Estado Persistente**
```typescript
// Recordar si estaba colapsado
const [isCollapsed, setIsCollapsed] = useLocalStorage(
  'sidebar-collapsed', 
  false
)

// Última sección visitada
const [lastSection, setLastSection] = useLocalStorage(
  'last-section',
  'search'
)
```

## 🎨 Temas y Personalización

### 1. **Variables CSS**
```css
.sidebar {
  --sidebar-width: 256px;
  --sidebar-collapsed-width: 64px;
  --sidebar-bg: var(--background);
  --sidebar-border: var(--border);
  --transition-speed: 200ms;
}
```

### 2. **Animaciones**
```typescript
const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 64 },
  hidden: { x: -256 }
}

<motion.aside
  variants={sidebarVariants}
  animate={sidebarState}
  transition={{ type: "spring", stiffness: 300 }}
/>
```

### 3. **Modo Pro**
```typescript
// Visual diferente para usuarios Pro
const sidebarClass = cn(
  "sidebar",
  {
    "sidebar--pro": user.isPro,
    "sidebar--collapsed": isCollapsed,
    "sidebar--mobile": isMobile
  }
)
```

## 💡 Tips del Mentor

### 1. **Jerarquía Visual**
- Logo: Identidad constante
- Usuario: Contexto personal
- Nav principal: Acciones frecuentes
- Tools: Acciones ocasionales
- Footer: Config y salida

### 2. **Accesibilidad**
```typescript
// Navegación por teclado
<nav role="navigation" aria-label="Menú principal">
  <ul role="list">
    {items.map(item => (
      <li key={item.id} role="listitem">
        <a
          role="menuitem"
          aria-current={isActive ? "page" : undefined}
          aria-label={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      </li>
    ))}
  </ul>
</nav>
```

### 3. **Performance**
```typescript
// Lazy load secciones pesadas
const Analytics = lazy(() => import('./sections/Analytics'))

// Memoizar cálculos costosos
const menuItems = useMemo(() => 
  generateMenuItems(user, permissions),
  [user, permissions]
)
```

## 🐛 Consideraciones Técnicas

### 1. **Z-Index Management**
```typescript
const Z_INDICES = {
  sidebar: 40,
  sidebarOverlay: 39,
  dropdown: 50,
  modal: 100,
  toast: 200
}
```

### 2. **Sincronización de Estado**
```typescript
// Sincronizar con router
useEffect(() => {
  setActiveItem(pathname)
}, [pathname])

// Sincronizar con tema del sistema
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (theme === 'system') {
    setIsDark(mediaQuery.matches)
  }
}, [theme])
```

### 3. **Mobile Gestures**
```typescript
// Swipe para cerrar en móvil
const handleSwipe = (e, { offset }) => {
  if (offset.x < -50) {
    closeSidebar()
  }
}
```

## 📊 Métricas UX

- **Tiempo a primera acción**: < 2 segundos
- **Clics para tareas comunes**: ≤ 2
- **Uso de shortcuts**: > 20% usuarios activos
- **Tasa de colapso (desktop)**: ~30%

## 🔧 Mejoras Futuras

1. **Customización**
   - Reordenar items
   - Ocultar/mostrar secciones
   - Temas personalizados

2. **AI Assistant**
   - Búsqueda por voz
   - Sugerencias contextuales
   - Comandos naturales

3. **Activity Feed**
   - Historial en tiempo real
   - Colaboración
   - Insights de uso

## 📚 Referencias

- [Sidebar Navigation Best Practices](https://www.nngroup.com/articles/vertical-nav/)
- [Mobile Navigation Patterns](https://www.lukew.com/ff/entry.asp?1945)
- [Accessible Navigation](https://www.w3.org/WAI/tutorials/menus/)

---

💎 **Reflexión del Mentor**: El sidebar es como el tablero de un auto: siempre visible, información esencial a la vista, controles al alcance. No lo sobrecargues. Cada elemento debe ganarse su lugar respondiendo: "¿Lo usa alguien al menos una vez por sesión?" Si no, va a un menú secundario.