# 🗄️ Configuración de Base de Datos - Karmatic

## 📋 Resumen

Este proyecto utiliza:
- **Prisma** para el esquema principal
- **PostgreSQL** con extensión `pgvector` para búsqueda híbrida
- **Funciones custom** para búsqueda semántica y análisis

## 🚀 Setup Inicial

### 1. Generar Cliente Prisma
```bash
npx prisma generate
```

### 2. Crear/Actualizar Esquema
```bash
# En desarrollo - usar migrate dev
npx prisma migrate dev --name init_with_documents

# En producción - usar migrate deploy
npx prisma migrate deploy
```

### 3. Aplicar Funciones Custom
Ejecutar en Supabase SQL Editor:
```sql
-- Ejecutar el contenido de:
-- prisma/migrations/custom-functions.sql
```

## 📊 Estructura de la Tabla Documents

La tabla `documents` está definida en `schema.prisma` con:
- `id`: BigInt autoincremental
- `content`: Texto del documento
- `metadata`: JSON con información estructurada
- `embedding`: Vector de 1536 dimensiones (OpenAI)
- `fts`: Full-text search (generado automáticamente)
- Timestamps automáticos

### Tipos de Documentos (metadata.type)
- `agency`: Información de agencias
- `agency_analysis`: Análisis de agencias
- `conversation_message`: Mensajes de chat AI
- `review`: Reseñas de usuarios

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Ver el esquema actual
npx prisma studio

# Sincronizar esquema (SOLO en dev sin datos)
npx prisma db push

# Crear nueva migración
npx prisma migrate dev --name descripcion_cambio
```

### Verificar Estado
```sql
-- En Supabase SQL Editor
-- Verificar tabla
SELECT * FROM documents LIMIT 5;

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name IN ('hybrid_search', 'get_user_conversations');

-- Verificar extensiones
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## ⚠️ Precauciones

1. **NUNCA** usar `prisma db push` en producción
2. **SIEMPRE** hacer backup antes de migraciones
3. **Las funciones custom** deben aplicarse manualmente después de las migraciones

## 🔄 Flujo de Trabajo Recomendado

1. **Cambios en esquema**: Modificar `schema.prisma`
2. **Generar migración**: `npx prisma migrate dev --name cambio`
3. **Si hay funciones nuevas**: Agregar a `custom-functions.sql`
4. **En producción**: 
   - Aplicar migración: `npx prisma migrate deploy`
   - Ejecutar funciones custom en Supabase

## 📚 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [pgvector](https://github.com/pgvector/pgvector)
- [Supabase Vector Embeddings](https://supabase.com/docs/guides/ai/vector-embeddings)