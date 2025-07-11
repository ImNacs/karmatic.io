# Karmatic Deployment Guide

## Overview

This guide covers deploying Karmatic to production environments. The application is optimized for deployment on Vercel with Supabase as the database provider.

## Prerequisites

- Node.js 18.x or later
- pnpm package manager
- Vercel account (recommended) or other hosting provider
- Supabase account for database
- Clerk account for authentication
- Google Cloud Platform account for Maps API

## Deployment Options

### Option 1: Vercel (Recommended)

#### 1. Initial Setup

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login
```

#### 2. Environment Variables

Set up environment variables in Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from `.env.example`:

```env
# Required variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
CLEANUP_SECRET_KEY
```

#### 3. Deploy

```bash
# Deploy to production
vercel --prod

# Or connect to GitHub for automatic deployments
vercel link
```

### Option 2: Docker

#### 1. Build Docker Image

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

#### 2. Build and Run

```bash
# Build image
docker build -t karmatic .

# Run container
docker run -p 3000:3000 --env-file .env.production karmatic
```

### Option 3: Traditional VPS

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
pnpm add -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/karmatic.git
cd karmatic

# Install dependencies
pnpm install

# Build application
pnpm build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'karmatic',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

## Database Setup

### 1. Supabase Configuration

1. Create a new Supabase project
2. Get connection strings from Settings > Database
3. Enable Row Level Security (RLS) on all tables

### 2. Run Migrations

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma client
pnpm prisma generate

# Deploy migrations
pnpm prisma migrate deploy
```

### 3. Set Up Indexes

```sql
-- Optimize search queries
CREATE INDEX idx_search_history_user_created 
ON "SearchHistory" ("userId", "createdAt" DESC) 
WHERE "deletedAt" IS NULL;

CREATE INDEX idx_search_history_anon_created 
ON "SearchHistory" ("anonymousId", "createdAt" DESC) 
WHERE "deletedAt" IS NULL;
```

## Post-Deployment Setup

### 1. Configure Clerk Webhooks

1. Go to Clerk Dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

### 2. Set Up Cleanup Cron Job

#### Using Vercel Cron

```json
// vercel.json
{
  "crons": [{
    "path": "/api/search/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

#### Using External Service

```bash
# Daily at 2 AM
0 2 * * * curl -X POST https://your-domain.com/api/search/cleanup \
  -H "Authorization: Bearer YOUR_CLEANUP_SECRET_KEY"
```

### 3. Configure Google Maps

1. Enable required APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
2. Add domain to API key restrictions
3. Set up billing alerts

## Performance Optimization

### 1. Enable Caching Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

### 2. Database Connection Pooling

Ensure `pgbouncer=true` in DATABASE_URL for connection pooling.

### 3. Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp']
  }
}
```

## Monitoring

### 1. Application Monitoring

```bash
# Install monitoring
pnpm add @sentry/nextjs

# Configure Sentry
npx @sentry/wizard@latest -i nextjs
```

### 2. Uptime Monitoring

Set up monitoring for:
- `https://your-domain.com` - Main site
- `https://your-domain.com/api/health` - API health
- `https://your-domain.com/api/search/cleanup` - Cleanup status

### 3. Log Aggregation

```javascript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ 
      level: 'info', 
      message, 
      ...meta, 
      timestamp: new Date().toISOString() 
    }))
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.stack || error, 
      timestamp: new Date().toISOString() 
    }))
  }
}
```

## Security Checklist

- [ ] All environment variables set correctly
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database RLS policies active
- [ ] API keys restricted by domain
- [ ] Webhook secrets verified
- [ ] Error messages don't leak sensitive info

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset connections
npx prisma db push --force-reset
```

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm build
```

### Memory Issues

```javascript
// Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

## Rollback Procedure

1. **Vercel**: Use dashboard to rollback to previous deployment
2. **Docker**: Tag images with versions and use previous tag
3. **VPS**: Use PM2 to revert to previous version

```bash
# PM2 rollback
pm2 deploy production revert 1
```

## Maintenance Mode

Create `maintenance.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Maintenance - Karmatic</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: system-ui; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0;
      background: #f3f4f6;
    }
    .container { 
      text-align: center; 
      padding: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>We'll be back soon!</h1>
    <p>We're performing scheduled maintenance. Please check back in a few minutes.</p>
  </div>
</body>
</html>
```

Enable maintenance mode:
```bash
# Nginx
location / {
  if (-f $document_root/maintenance.html) {
    return 503;
  }
}
error_page 503 @maintenance;
location @maintenance {
  rewrite ^(.*)$ /maintenance.html break;
}
```

---

For deployment support, contact: support@karmatic.io