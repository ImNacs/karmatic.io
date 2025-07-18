# Configuración de Variables de Entorno - Karmatic

## ⚠️ Error: "Error en análisis de confianza"

Este error ocurre cuando faltan las variables de entorno necesarias para las APIs.

## 🔧 Solución Rápida

1. **Copia el archivo de ejemplo**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configura las variables mínimas necesarias**:

### APIs Requeridas (CRÍTICAS)

```env
# Google Places API - Para buscar agencias
GOOGLE_PLACES_API_KEY=tu-api-key-aqui
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-api-key-aqui

# Apify - Para obtener reseñas completas
APIFY_API_TOKEN=apify_api_tu-token-aqui

# OpenRouter - Para el chat con IA
OPENROUTER_API_KEY=sk-or-v1-tu-api-key-aqui
```

### Dónde obtener las API Keys:

1. **Google Places API**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un proyecto nuevo
   - Habilita "Places API" y "Maps JavaScript API"
   - Crea credenciales → API Key
   - Restringe la key a tu dominio

2. **Apify Token**:
   - Regístrate en [Apify](https://console.apify.com)
   - Ve a Settings → Integrations
   - Copia tu API token

3. **OpenRouter API Key**:
   - Regístrate en [OpenRouter](https://openrouter.ai)
   - Ve a Keys
   - Crea una nueva API key

### Verificar configuración:

```bash
# Verifica que las variables estén configuradas
npm run dev

# Si sigues viendo errores, revisa los logs del servidor
# Busca mensajes como "API key not found" o "Missing environment variable"
```

## 🚨 Errores Comunes

1. **"Error en análisis de confianza"**
   - Falta `GOOGLE_PLACES_API_KEY`
   - La API key no tiene permisos para Places API

2. **"Error al obtener reseñas"**
   - Falta `APIFY_API_TOKEN`
   - Token inválido o expirado

3. **"AI assistant not available"**
   - Falta `OPENROUTER_API_KEY`
   - Key sin créditos

## 📝 Configuración Mínima para Desarrollo

Si solo quieres probar el sistema localmente:

```env
# .env.local
GOOGLE_PLACES_API_KEY=tu-key-de-google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=la-misma-key-de-google
APIFY_API_TOKEN=tu-token-de-apify
OPENROUTER_API_KEY=tu-key-de-openrouter

# Supabase (usa el proyecto de prueba)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-key

# Clerk (opcional para desarrollo)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_tu-key
CLERK_SECRET_KEY=sk_test_tu-key
```

## ✅ Verificación Final

Reinicia el servidor y prueba:
```bash
npm run dev
```

Deberías poder:
1. Buscar agencias sin error
2. Ver resultados con trust scores
3. Usar el chat (si configuraste OpenRouter)