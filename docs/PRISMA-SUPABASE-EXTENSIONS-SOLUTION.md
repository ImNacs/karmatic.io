# 🔧 Solución: Drift de Extensiones Prisma + Supabase

## 📋 Problema Identificado

El drift detection de Prisma mostraba que las extensiones `pg_stat_statements`, `pgcrypto`, y `uuid-ossp` estaban "Changed" porque:

1. **Supabase pre-instala estas extensiones** en el schema `extensions`, no en `public`
2. **Prisma espera que las extensiones** estén en el schema donde se ejecuta la migración (public)
3. **La base de datos aparecía vacía** porque solo existía la tabla `_prisma_migrations`

## 🎯 Causa Raíz

```sql
-- En Supabase, las extensiones están en diferentes schemas:
pg_stat_statements -> schema: extensions
pgcrypto          -> schema: extensions  
uuid-ossp         -> schema: extensions
vector            -> schema: public
pg_graphql        -> schema: graphql
supabase_vault    -> schema: vault
```

Prisma no puede manejar extensiones en diferentes schemas, causando el drift permanente.

## ✅ Solución Aplicada

### 1. Modificamos la migración inicial de extensiones

```sql
-- migrations/00000000000000_supabase_extensions/migration.sql
-- Solo intentamos crear la extensión vector que sí está en public
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;
```

### 2. Creamos la migración para las tablas

```bash
# Creamos migrations/20250113000000_create_tables/migration.sql
# Con todas las tablas del schema
```

### 3. Aplicamos las migraciones

```bash
pnpm prisma migrate deploy
```

## 🚀 Flujo de Trabajo Recomendado

### Para nuevas migraciones:

1. **Modificar schema.prisma**
2. **Crear migración:**
   ```bash
   pnpm prisma migrate dev --name descripcion_cambio
   ```
3. **Si Prisma detecta drift de extensiones**, ignorarlo - es esperado
4. **En producción:**
   ```bash
   pnpm prisma migrate deploy
   ```

### Para verificar estado:

```bash
# Ver estado de migraciones
pnpm prisma migrate status

# Ver tablas creadas
pnpm prisma studio
```

## ⚠️ Notas Importantes

1. **NO usar `prisma db push`** - Puede causar pérdida de datos
2. **El drift de extensiones es normal** en Supabase - no es un error
3. **Las extensiones ya están disponibles** para usar:
   - `gen_random_uuid()` - disponible globalmente
   - `crypt()`, `digest()` - usar con prefijo: `extensions.crypt()`
   - `vector` - disponible en public schema

## 📊 Estado Final

- ✅ Migraciones aplicadas correctamente
- ✅ Tablas creadas en la base de datos
- ✅ Schema sincronizado con Prisma
- ⚠️ Drift de extensiones (esperado y sin impacto)

## 🔍 Comandos de Verificación

```sql
-- Verificar tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verificar extensiones
SELECT extname, extnamespace::regnamespace FROM pg_extension;

-- Verificar funciones disponibles
SELECT proname, pronamespace::regnamespace 
FROM pg_proc 
WHERE proname IN ('gen_random_uuid', 'crypt', 'vector_in');
```