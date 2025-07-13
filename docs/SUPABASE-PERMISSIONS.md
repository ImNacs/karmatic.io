# Permisos de Supabase

## Estado Actual

- RLS (Row Level Security) está **DESHABILITADO** en todas las tablas para simplificar el desarrollo
- Los permisos están manejados a nivel de funciones SQL
- **NOTA**: Actualmente usando `SERVICE_ROLE_KEY` en las APIs que tiene permisos completos

## Tablas sin RLS

- `User`
- `conversations` 
- `messages`
- `documents`

## Funciones con Permisos

Todas las funciones tienen permisos para `anon`, `authenticated` y `authenticator`:

- `get_search_history`
- `check_anonymous_search_limit`
- `save_initial_search`
- `delete_search_history`
- `transfer_anonymous_history`
- `get_conversation_messages`

## Para Habilitar RLS en el Futuro

Cuando esté listo para producción, ejecutar:

```sql
-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Crear políticas apropiadas
-- Ver script en scripts/enable-rls.sql
```

## Notas

- PostgREST usa el rol `authenticator` que luego cambia a `anon` o `authenticated`
- Las funciones SQL manejan la lógica de autorización internamente
- Este approach simplifica el desarrollo inicial