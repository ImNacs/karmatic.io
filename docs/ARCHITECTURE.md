# Karmatic Architecture Documentation

## Overview

Karmatic is a modern web application built with Next.js 15, featuring a routed architecture that provides unique URLs for each search result. The application follows best practices for scalability, maintainability, and user experience.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Client App    │────▶│   Next.js API   │────▶│    Database     │
│  (React + TS)   │     │    Routes       │     │   (Supabase)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                         │
        │                       │                         │
        ▼                       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Clerk       │     │  Google Maps    │     │    Prisma       │
│    (Auth)       │     │      API        │     │     (ORM)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Core Design Principles

### 1. **Routed Architecture**
- Each search has a unique URL: `/explorer/[search_id]`
- Enables sharing, bookmarking, and browser history
- SEO-friendly structure
- Inspired by YouLearn.ai's approach

### 2. **Optimistic UI Updates**
- Immediate feedback using React 19's `useOptimistic`
- SWR for intelligent data fetching and caching
- No loading spinners for common actions
- Inspired by Perplexity's instant updates

### 3. **Progressive Enhancement**
- Works without JavaScript (SSR)
- Enhanced with client-side features
- Graceful degradation
- Mobile-first responsive design

### 4. **Data Persistence**
- Soft delete with 30-day recovery
- Anonymous user tracking via cookies
- Search history preservation
- Automatic session migration on sign-up

## Technical Stack

### Frontend Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group routes
│   ├── explorer/          # Search results routes
│   │   └── [search_id]/   # Dynamic route
│   ├── api/               # API endpoints
│   └── layout.tsx         # Root layout with sidebar
├── components/            
│   ├── ui/                # Base components (shadcn/ui)
│   └── features/          # Feature-specific components
│       ├── sidebar/       # Persistent navigation
│       └── agency-map/    # Map components
├── contexts/              # React contexts
│   └── SearchHistoryContext.tsx
└── lib/                   # Utilities
    ├── auth/             # Auth helpers
    └── supabase/         # DB clients
```

### State Management

```typescript
// Global State
SearchHistoryContext (React Context + SWR)
├── Server State (SWR)
│   └── Search History
└── Client State (useOptimistic)
    └── Optimistic Updates

// Local State
Component State (useState, useReducer)
└── UI State (forms, modals, etc.)
```

### Data Flow

1. **Search Flow**
   ```
   User Input → Validate → Save to DB → Get ID → Navigate → Display Results
   ```

2. **History Update Flow**
   ```
   Action → Optimistic Update → API Call → SWR Revalidation
   ```

3. **Delete Flow**
   ```
   Delete Click → Optimistic Remove → Soft Delete API → Update UI
   ```

## Database Schema

### Core Models

```prisma
model User {
  id          String   @id @default(cuid())
  clerkUserId String   @unique
  email       String?  @unique
  // ... other fields
  searchHistory SearchHistory[]
}

model SearchHistory {
  id          String    @id @default(cuid())
  location    String
  query       String?
  resultsJson Json?
  createdAt   DateTime  @default(now())
  deletedAt   DateTime? // Soft delete
  
  // Relations
  userId      String?
  user        User?     @relation(...)
  anonymousId String?
  anonymous   AnonymousSearch? @relation(...)
  
  @@index([deletedAt])
}

model AnonymousSearch {
  id          String   @id @default(cuid())
  identifier  String   @unique // Cookie ID
  searches    SearchHistory[]
}
```

### Key Design Decisions

1. **Soft Delete**: `deletedAt` field for recovery
2. **Anonymous Tracking**: Separate table for GDPR compliance
3. **JSON Storage**: Flexible result storage
4. **Indexes**: Optimized for common queries

## API Design

### RESTful Endpoints

```
POST   /api/search/save              # Save new search
GET    /api/search/history           # Get user's history
DELETE /api/search/history/[id]      # Soft delete
POST   /api/search/history/[id]/restore # Restore deleted
GET    /api/search/cleanup           # Cleanup status
POST   /api/search/cleanup           # Run cleanup
```

### Response Standards

```typescript
// Success Response
{
  success: true,
  data: { ... },
  message?: string
}

// Error Response
{
  error: string,
  message: string,
  details?: any // Dev only
}
```

## Security Architecture

### Authentication Flow

```
User → Clerk → Webhook → Sync DB → Session
         ↓
    Anonymous → Cookie → Tracking
```

### Security Layers

1. **Authentication**: Clerk with JWT
2. **Authorization**: Row-level checks
3. **Rate Limiting**: Per-user/session
4. **Input Validation**: Zod schemas
5. **SQL Injection**: Prisma parameterized queries
6. **XSS Protection**: React sanitization
7. **CSRF**: SameSite cookies

## Performance Optimizations

### Client-Side

1. **Code Splitting**
   - Route-based splitting
   - Dynamic imports for heavy components
   - Lazy loading for maps

2. **Caching Strategy**
   ```typescript
   // SWR Configuration
   {
     revalidateOnFocus: false,
     dedupingInterval: 60000,
     refreshInterval: 0
   }
   ```

3. **Image Optimization**
   - Next.js Image component
   - WebP/AVIF formats
   - Lazy loading

### Server-Side

1. **Database Optimization**
   - Connection pooling
   - Indexed queries
   - Selective field returns

2. **API Optimization**
   - Edge runtime where possible
   - Minimal JSON payloads
   - Compression

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
    ├── Next.js Instance 1
    ├── Next.js Instance 2
    └── Next.js Instance N
         │
         └── Shared Database (Supabase)
```

### Caching Layers

1. **Browser Cache**: Static assets
2. **CDN**: Global distribution
3. **API Cache**: SWR deduplication
4. **Database Cache**: Query optimization

## Monitoring & Observability

### Key Metrics

```typescript
// Performance Metrics
- Page Load Time
- Time to Interactive
- API Response Time
- Database Query Time

// Business Metrics
- Search Volume
- User Retention
- Feature Adoption
- Error Rate
```

### Logging Strategy

```typescript
logger.info('Search saved', {
  userId: user?.id,
  location: searchData.location,
  timestamp: new Date()
})
```

## Future Architecture Considerations

### Microservices Migration

```
API Gateway
├── Search Service
├── User Service
├── Analytics Service
└── AI Service
```

### Event-Driven Architecture

```
User Action → Event Bus → Services
                ├── Search History
                ├── Analytics
                └── Notifications
```

### AI Integration Points

1. **Search Enhancement**: Query understanding
2. **Result Ranking**: ML-based sorting
3. **Recommendations**: Personalized suggestions
4. **Chat Interface**: Conversational search

## Development Workflow

### Branch Strategy

```
main
├── develop
│   ├── feature/search-history
│   ├── feature/soft-delete
│   └── fix/navigation-bug
└── release/v2.0
```

### Testing Strategy

```
Unit Tests (Jest)
├── Component Tests
├── Hook Tests
└── Utility Tests

Integration Tests
├── API Tests
└── Database Tests

E2E Tests (Playwright)
└── User Journeys
```

## Deployment Architecture

### Production Setup

```
Vercel (Frontend + API)
    ├── Edge Functions
    ├── Serverless Functions
    └── Static Assets → CDN
         │
         └── Supabase (Database)
             ├── PostgreSQL
             ├── Row Level Security
             └── Connection Pooling
```

### CI/CD Pipeline

```
GitHub Push → Vercel Build → Tests → Deploy
                  ├── Type Check
                  ├── Lint
                  ├── Unit Tests
                  └── Build
```

---

This architecture is designed to scale with user growth while maintaining excellent performance and developer experience. For specific implementation details, refer to the codebase and inline documentation.