# Configuración de Clerk + Supabase + Prisma

## 🚀 Configuración Rápida

### 1. Configurar Variables de Entorno

Copia las variables de `.env.example` a `.env.local` y completa con tus valores:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# Database URLs
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://[user]:[password]@[host]:5432/postgres"
```

### 2. Configurar Clerk Dashboard

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com)
2. En **Integrations**, busca **Supabase** y actívala
3. En **Webhooks** (opcional para producción):
   - URL: `https://tu-dominio.com/api/webhooks/clerk`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
   - Copia el `Signing Secret` a `CLERK_WEBHOOK_SECRET`

### 3. Configurar Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. En **Authentication > Providers**, habilita **Clerk**
3. Configura con tu dominio de Clerk:
   - Frontend API: `https://[your-clerk-domain].clerk.accounts.dev`
   - O simplemente copia tu dominio desde Clerk Dashboard

### 4. Ejecutar Migraciones

```bash
# Generar cliente de Prisma
pnpm prisma generate

# Crear las tablas en Supabase
pnpm prisma db push

# O usar migraciones (recomendado para producción)
pnpm prisma migrate dev --name init
```

### 5. Aplicar RLS Policies

Ejecuta el SQL en `prisma/migrations/rls-policies.sql` en el SQL Editor de Supabase.

### 6. Crear Usuario Dedicado para Prisma (Opcional pero recomendado)

En Supabase SQL Editor:

```sql
-- Crear usuario
CREATE USER prisma_user WITH PASSWORD 'secure_password_here';

-- Dar permisos
GRANT USAGE ON SCHEMA public TO prisma_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prisma_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma_user;
```

Luego actualiza tu `DATABASE_URL` con el nuevo usuario.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/clerk/   # Webhook para sincronizar usuarios
│   │   ├── agencies/         # API de agencias
│   │   └── test-auth/        # Endpoint de prueba
│   ├── sign-in/              # Página de inicio de sesión
│   ├── sign-up/              # Página de registro
│   └── profile/              # Perfil de usuario
├── lib/
│   ├── auth/
│   │   └── helpers.ts        # Helpers de autenticación
│   ├── supabase/
│   │   ├── client.ts         # Cliente para navegador
│   │   └── server.ts         # Cliente para servidor
│   └── prisma.ts             # Cliente de Prisma
├── middleware.ts             # Middleware de autenticación
└── prisma/
    └── schema.prisma         # Esquema de base de datos
```

## 🔧 Uso

### Cliente de Supabase (Client Components)

```typescript
'use client';
import { useSupabaseClient } from '@/lib/supabase/client';

export function MyComponent() {
  const supabase = useSupabaseClient();
  
  // Usar supabase client...
}
```

### Prisma en Server Components/API Routes

```typescript
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth/helpers';

export async function GET() {
  const user = await getOrCreateUser();
  
  const agencies = await prisma.agency.findMany({
    where: { createdById: user.id }
  });
  
  return Response.json({ agencies });
}
```

### Proteger Rutas

Las rutas se protegen automáticamente con el middleware. Para agregar más rutas protegidas, edita `middleware.ts`:

```typescript
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/profile(.*)',
  '/tu-ruta-protegida(.*)',
]);
```

## 🧪 Probar la Integración

1. Inicia el servidor: `pnpm dev`
2. Visita http://localhost:3000
3. Crea una cuenta o inicia sesión
4. Verifica que el usuario se sincronice en la base de datos
5. Visita `/profile` para ver los datos del usuario

## 🚨 Solución de Problemas

### Error: "CLERK_WEBHOOK_SECRET is not set"
- Asegúrate de configurar el webhook en Clerk Dashboard
- Copia el Signing Secret a tu `.env.local`

### Error: "auth.jwt() is null"
- Verifica que Clerk esté configurado como proveedor en Supabase
- Asegúrate de que la integración de Supabase esté activada en Clerk Dashboard

### Las migraciones fallan
- Verifica las URLs de conexión a la base de datos
- Asegúrate de usar `DIRECT_URL` para migraciones (sin pgbouncer)

## 📚 Recursos

- [Clerk Docs](https://clerk.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Guía de Integración Clerk + Supabase](https://clerk.com/docs/integrations/databases/supabase)