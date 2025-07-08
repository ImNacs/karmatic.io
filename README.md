# Karmatic - Análisis de Agencias Automotrices

Una aplicación moderna para explorar, analizar y seleccionar las mejores agencias automotrices. Inspirada en la experiencia de usuario de Airbnb, Perplexity, Uber y Bumble.

## ✨ Características

- 🗺️ **Búsqueda por ubicación** - Encuentra agencias cerca de ti
- 📍 **Mapa interactivo** - Visualiza agencias con ratings como marcadores
- 🔍 **Análisis detallado** - Selecciona hasta 3 agencias para análisis profundo
- 💬 **Chat con IA** - Pregunta sobre las agencias analizadas
- 🌗 **Modo oscuro/claro** - Alterna entre temas
- 📱 **PWA Ready** - Instala como aplicación web
- 🎭 **Animaciones fluidas** - Experiencia de usuario moderna

## 🛠️ Tecnologías

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Styling:** Tailwind CSS 4 (soporte modo oscuro nativo)
- **UI:** shadcn/ui
- **Iconos:** React Icons
- **Formularios:** React Hook Form + Zod
- **Animaciones:** Motion
- **Temas:** next-themes

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## 📱 Funcionalidades

### 1. Búsqueda de Agencias
- Ingresa tu ubicación o usa geolocalización
- Filtro opcional por tipo de vehículo o presupuesto
- Búsqueda con simulación de tiempo real

### 2. Mapa Interactivo
- Visualización estilo Airbnb
- Marcadores con rating de cada agencia
- Agencias destacadas (rating ≥ 4.0) en verde
- Detalles al hacer clic en marcadores

### 3. Detalle de Agencias (Estilo Bumble)
- Galería de imágenes
- Información de contacto y horarios
- Reseñas de usuarios
- Análisis preliminar para agencias destacadas
- Selección para análisis detallado (máximo 3)

### 4. Análisis Detallado
- Análisis profundo con IA simulada
- Fortalezas y recomendaciones por agencia
- Fuentes y referencias
- Comparación entre agencias seleccionadas

### 5. Chat con IA (Estilo Perplexity)
- Preguntas sobre las agencias analizadas
- Respuestas contextuales (en desarrollo)
- Historial de conversación

## 🎨 Componentes Principales

- `SearchInterface` - Interfaz de búsqueda principal
- `AgencyMap` - Mapa con marcadores interactivos
- `AgencyDetail` - Modal detallado de cada agencia
- `LoadingScreen` - Pantallas de carga animadas
- `Header` - Navegación con tema y menú
- `ThemeProvider` - Proveedor de temas

## 📁 Estructura del Proyecto

```
src/
├── app/                  # App Router de Next.js
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página principal
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de shadcn/ui
│   ├── header.tsx      # Navegación
│   ├── search-interface.tsx
│   ├── agency-map.tsx
│   ├── agency-detail.tsx
│   ├── loading-screen.tsx
│   └── theme-provider.tsx
└── types/              # Definiciones de tipos
    └── agency.ts       # Tipos para agencias y búsquedas
```

## 🎯 Próximas Características

- [ ] Integración real con Google Places API
- [ ] Conectar con webhooks de n8n
- [ ] Implementar chat funcional con IA
- [ ] Sistema de autenticación de usuarios
- [ ] Gestión de planes y tokens
- [ ] Historial de búsquedas
- [ ] Notificaciones push
- [ ] Modo offline

## 📱 Uso

1. **Buscar:** Ingresa tu ubicación y términos opcionales
2. **Explorar:** Ve el mapa con agencias marcadas por rating
3. **Detallar:** Haz clic en una agencia para ver detalles
4. **Seleccionar:** Escoge hasta 3 agencias para análisis
5. **Analizar:** Ejecuta el análisis detallado
6. **Preguntar:** Usa el chat para consultas específicas

---

**Nota:** Esta es una implementación de frontend únicamente. La lógica de backend debe implementarse en n8n según las especificaciones del proyecto.
