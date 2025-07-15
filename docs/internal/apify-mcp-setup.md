# Configuración Apify MCP (Interno)

> ⚠️ **CONFIDENCIAL**: Este documento es solo para uso interno del equipo de desarrollo.

## 🚀 Setup Inicial

### 1. Obtener Token API
1. Ir a [Apify Console](https://console.apify.com/account/integrations)
2. Copiar el API token personal
3. **NUNCA** compartir o commitear este token

### 2. Configurar Variable de Entorno
```bash
# En .env.local
APIFY_API_TOKEN=apify_api_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Verificar Instalación
```bash
# Ejecutar script de prueba
pnpm run test:apify
```

## 🔧 Arquitectura

```
Frontend (UI)
    ↓
API Routes (/api/ai/chat)
    ↓
Mastra Agent
    ↓
MCP Client → Apify Actors
```

### Componentes Clave:
- `src/mastra/mcpServers/apify.ts` - Cliente MCP configurado
- `src/mastra/index.ts` - Registro con Mastra
- Sin exposición en frontend
- Sin configuración de usuario

## 🚗 Actores Configurados

### 1. **Google Maps Scraper** (`compass/crawler-google-places`)
- **Uso**: Búsqueda principal de concesionarios
- **Datos**: Dirección, teléfono, horarios, reseñas, fotos
- **Categorías**: "car dealer", "auto dealer"

### 2. **Google Maps Extractor** (`compass/google-maps-extractor`)
- **Uso**: Búsquedas rápidas y masivas
- **Ventaja**: Más económico para grandes volúmenes
- **Ideal para**: Búsquedas por código postal

### 3. **Contact Details Enricher** (`lukaskrivka/google-maps-with-contact-details`)
- **Uso**: Obtener emails y redes sociales
- **Datos**: Email, Facebook, Instagram, LinkedIn
- **Para**: Información de contacto enriquecida

### 4. **RAG Web Browser** (`apify/rag-web-browser`)
- **Uso**: Análisis de sitios web
- **Para**: Inventario, promociones, información adicional

## 🛠️ Troubleshooting

### Error: "APIFY_API_TOKEN not configured"
- Verificar que el token esté en `.env.local`
- Reiniciar el servidor de desarrollo

### Error 401: Unauthorized
- Token inválido o expirado
- Verificar en Apify Console

### Error 403: Rate Limit
- Límite de API alcanzado
- Revisar plan en Apify

### Sin herramientas disponibles
- Verificar conexión a internet
- Ejecutar `pnpm run test:apify`

## 📊 Límites y Costos

### Plan Free
- 5 USD de créditos mensuales
- ~1,250 búsquedas básicas
- ~625 búsquedas con contactos

### Optimizaciones
- Cachear resultados frecuentes
- Usar `google-maps-extractor` para volumen
- Limitar campos extraídos

## 🔐 Seguridad

1. **Token API**: Solo en variables de entorno del servidor
2. **Sin exposición**: Nunca mostrar Apify en UI
3. **Sanitización**: Filtrar menciones de herramientas
4. **Logs**: No guardar datos sensibles

## 📝 Notas de Implementación

- El sistema funciona sin Apify si no hay token
- Las herramientas se cargan dinámicamente
- Los usuarios nunca ven referencias a Apify
- Todo pasa por el agente AI como intermediario

---

**Última actualización**: Enero 2025
**Contacto**: Equipo Backend