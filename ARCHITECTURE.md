# Karmatic Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Search Limiting Implementation](#search-limiting-implementation)
- [API Architecture](#api-architecture)
- [Frontend Architecture](#frontend-architecture)
- [GTM Integration](#gtm-integration)
- [Security Architecture](#security-architecture)
- [Performance Optimizations](#performance-optimizations)
- [Deployment Architecture](#deployment-architecture)

## Overview

Karmatic is a modern, full-stack web application built with Next.js 15, designed to help users discover and analyze automotive agencies. The architecture emphasizes scalability, security, and exceptional user experience through intelligent rate limiting, real-time mapping, and AI-powered insights.

### Key Architectural Principles

1. **Separation of Concerns** - Clear boundaries between presentation, business logic, and data layers
2. **Type Safety** - End-to-end TypeScript for reliability and developer experience
3. **Performance First** - Optimized for Core Web Vitals with lazy loading and code splitting
4. **Security by Design** - Multiple layers of security from authentication to data access
5. **Scalability** - Stateless design with edge-ready architecture

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Client App    │────▶│   Next.js API   │────▶│    Database     │
│  (React/Next)   │     │     Routes      │     │   (Supabase)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Google Maps   │     │     Clerk       │     │     Prisma      │
│      API        │     │  (Auth Service) │     │      ORM        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Component Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints (server-side)
│   ├── (auth)/           # Authentication pages
│   └── [routes]/         # Application routes
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   └── [features]/       # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities and services
│   ├── auth/             # Authentication utilities
│   ├── gtm/              # Analytics integration
│   └── supabase/         # Database clients
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      User       │     │  SearchHistory   │     │ AnonymousSearch  │
├─────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)         │────▶│ id (PK)          │◀────│ id (PK)          │
│ clerkUserId     │     │ userId (FK)      │     │ identifier       │
│ email           │     │ anonymousId (FK) │     │ searchCount      │
│ firstName       │     │ location         │     │ lastSearchAt     │
│ lastName        │     │ query            │     │ createdAt        │
│ imageUrl        │     │ resultsJson      │     │                  │
│ phoneNumber     │     │ createdAt        │     │                  │
│ createdAt       │     │                  │     │                  │
│ updatedAt       │     │                  │     │                  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

### Prisma Schema Details

```prisma
model User {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  clerkUserId String   @unique
  email       String?  @unique
  firstName   String?
  lastName    String?
  imageUrl    String?
  phoneNumber String?
  
  // Relations
  searchHistory SearchHistory[]

  @@index([email])
  @@index([clerkUserId])
}

model AnonymousSearch {
  id           String   @id @default(cuid())
  identifier   String   @unique // Cookie ID
  searchCount  Int      @default(0)
  lastSearchAt DateTime @default(now())
  createdAt    DateTime @default(now())
  
  // Related searches
  searches     SearchHistory[]
  
  @@index([identifier, lastSearchAt])
}

model SearchHistory {
  id          String   @id @default(cuid())
  location    String
  query       String?
  resultsJson Json?    // Store search results
  createdAt   DateTime @default(now())
  
  // Relations - either anonymous or authenticated
  anonymousId String?
  anonymous   AnonymousSearch? @relation(fields: [anonymousId], references: [id])
  
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([anonymousId])
  @@index([createdAt])
}
```

### Database Design Decisions

1. **User Table** - Synced with Clerk, stores essential user data
2. **AnonymousSearch** - Tracks search limits for non-authenticated users
3. **SearchHistory** - Polymorphic association supporting both user types
4. **JSONB for Results** - Flexible storage for varying API responses
5. **Indexes** - Optimized for common query patterns

## Authentication Flow

### User Authentication Journey

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  Clerk   │    │ Next.js  │    │ Database │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │  Sign Up      │               │               │
     ├──────────────▶│               │               │
     │               │               │               │
     │               │  Create User  │               │
     │               ├──────────────▶│               │
     │               │               │               │
     │               │               │  Webhook      │
     │               │               ├──────────────▶│
     │               │               │               │
     │               │               │  Create DB    │
     │               │               │  Record       │
     │               │               │◀──────────────┤
     │               │               │               │
     │  Auth Token   │               │               │
     │◀──────────────┤               │               │
     │               │               │               │
```

### Authentication Implementation

1. **Clerk Integration**
   - Handles user registration, login, and session management
   - Provides JWT tokens for API authentication
   - Supports social logins (Google, GitHub, etc.)

2. **Middleware Protection**
   ```typescript
   // middleware.ts
   export default clerkMiddleware(async (auth, req) => {
     if (isProtectedRoute(req)) {
       await auth.protect();
     }
   });
   ```

3. **User Synchronization**
   - Webhook endpoint syncs Clerk users with database
   - Handles user creation, updates, and deletion
   - Maintains data consistency across systems

## Search Limiting Implementation

### Architecture Overview

The search limiting system uses a cookie-based approach to track anonymous users and enforce rate limits without requiring authentication.

### Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │     │   API Route  │     │  Database   │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                     │
       │ Check Limit       │                     │
       ├──────────────────▶│                     │
       │                   │                     │
       │                   │ Get Session         │
       │                   ├────────────────────▶│
       │                   │                     │
       │                   │ Return Count        │
       │                   │◀────────────────────┤
       │                   │                     │
       │ Limit Status      │                     │
       │◀──────────────────┤                     │
       │                   │                     │
```

### Implementation Details

1. **Session Management**
   ```typescript
   // Cookie-based session tracking
   export const SEARCH_SESSION_COOKIE = 'karmatic_search_session';
   
   export async function getOrCreateSearchSession(): Promise<string> {
     const cookieStore = await cookies();
     const existingSession = cookieStore.get(SEARCH_SESSION_COOKIE);
     
     if (existingSession?.value) {
       return existingSession.value;
     }
     
     // Create new session with nanoid
     const newSessionId = nanoid();
     // Set HTTP-only cookie
     return newSessionId;
   }
   ```

2. **Rate Limiting Logic**
   - Anonymous users: 1 search per 24 hours
   - Authenticated users: Unlimited searches
   - Reset period: 24 hours from last search
   - Graceful handling of edge cases

3. **Frontend Integration**
   ```typescript
   // Custom hook for search limit management
   export function useSearchLimit() {
     const { user, isLoaded } = useUser();
     const [limit, setLimit] = useState<SearchLimit>({
       remaining: 1,
       total: 1,
       isAuthenticated: false,
       canSearch: true,
       loading: true,
     });
     // ... implementation
   }
   ```

## API Architecture

### RESTful API Design

```
/api/
├── auth/
│   └── sync-user/        # POST - Clerk webhook for user sync
├── search/
│   ├── check-limit/      # GET - Check search limit status
│   └── track/            # POST - Track search usage
├── agencies/
│   ├── search/           # POST - Search agencies
│   └── [id]/            # GET - Get agency details
└── webhooks/
    └── clerk/           # POST - Clerk webhook endpoint
```

### API Response Standards

All API responses follow a consistent format:

```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    pagination?: PaginationMeta,
    timestamp: string
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Error Handling Strategy

1. **Validation Errors** (400) - Invalid input data
2. **Authentication Errors** (401) - Missing or invalid auth
3. **Authorization Errors** (403) - Insufficient permissions
4. **Not Found Errors** (404) - Resource doesn't exist
5. **Rate Limit Errors** (429) - Too many requests
6. **Server Errors** (500) - Unexpected errors

## Frontend Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── AuthHeader
│   │   └── ThemeToggle
│   └── Main Content
├── SearchInterface
│   ├── LocationAutocomplete
│   ├── SearchLimitIndicator
│   └── SearchButton
├── AgencyMap
│   ├── GoogleMap
│   ├── MapMarkers
│   └── MarkerClustering
└── AgencyDetail
    ├── AgencyInfo
    ├── ReviewSection
    └── ContactInfo
```

### State Management

1. **Local State** - Component-specific state with useState
2. **Context API** - Theme and authentication state
3. **Server State** - React Query for API data (planned)
4. **Form State** - React Hook Form with Zod validation

### Performance Patterns

1. **Code Splitting**
   ```typescript
   const AgencyMap = dynamic(() => import('@/components/agency-map'), {
     loading: () => <MapSkeleton />,
     ssr: false
   });
   ```

2. **Image Optimization**
   ```typescript
   <Image
     src={agency.image}
     alt={agency.name}
     width={800}
     height={600}
     priority={isAboveFold}
     placeholder="blur"
   />
   ```

3. **Memoization**
   ```typescript
   const expensiveComputation = useMemo(() => {
     return calculateAgencyScore(agency);
   }, [agency]);
   ```

## GTM Integration

### Event Tracking Architecture

```typescript
// GTM Event Structure
interface GTMEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  custom_dimensions?: Record<string, any>;
}
```

### Tracked Events

1. **User Events**
   - Sign Up Started/Completed
   - Sign In
   - Profile Updated

2. **Search Events**
   - Search Initiated
   - Search Completed
   - Search Limited (anonymous)
   - Location Selected

3. **Engagement Events**
   - Agency Viewed
   - Agency Compared
   - Contact Clicked
   - Map Interaction

### Implementation Example

```typescript
export const trackEvent = {
  searchInitiated: (location: string, query?: string, isAuthenticated?: boolean) => {
    pushToDataLayer({
      event: 'search_initiated',
      category: 'search',
      action: 'initiate',
      label: location,
      custom_dimensions: {
        search_query: query || 'none',
        user_type: isAuthenticated ? 'authenticated' : 'anonymous'
      }
    });
  }
};
```

## Security Architecture

### Security Layers

1. **Authentication Layer**
   - Clerk handles authentication
   - JWT tokens for API access
   - Secure session management

2. **Authorization Layer**
   - Middleware-based route protection
   - Role-based access control (future)
   - Resource-level permissions

3. **Data Protection**
   - Input validation with Zod
   - SQL injection prevention via Prisma
   - XSS protection in React
   - CSRF protection with SameSite cookies

4. **API Security**
   - Rate limiting
   - Request validation
   - Error message sanitization
   - Webhook signature verification

### Security Best Practices

1. **Environment Variables**
   - Never commit secrets
   - Use different keys per environment
   - Rotate keys regularly

2. **Content Security Policy**
   ```typescript
   // next.config.ts
   const securityHeaders = [
     {
       key: 'Content-Security-Policy',
       value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com"
     }
   ];
   ```

3. **HTTPS Enforcement**
   - Force HTTPS in production
   - Secure cookies
   - HSTS headers

## Performance Optimizations

### Frontend Optimizations

1. **Bundle Size Optimization**
   - Tree shaking with ES modules
   - Dynamic imports for large components
   - Minimal runtime CSS with Tailwind

2. **Rendering Optimizations**
   - Server Components by default
   - Client Components only when needed
   - Streaming SSR with Suspense

3. **Asset Optimization**
   - Next.js Image component
   - Font optimization
   - Static asset caching

### Backend Optimizations

1. **Database Optimizations**
   - Indexed queries
   - Connection pooling with pgBouncer
   - Efficient query patterns

2. **Caching Strategy**
   - Static page caching
   - API response caching (planned)
   - CDN for assets

3. **Edge Optimization**
   - Middleware runs at edge
   - Static generation where possible
   - ISR for dynamic content

## Deployment Architecture

### Infrastructure Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Vercel      │────▶│    Supabase     │────▶│     Clerk       │
│   (Frontend)    │     │   (Database)    │     │    (Auth)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│                 │                             │                 │
│   Google Maps   │                             │      GTM        │
│      API        │                             │   (Analytics)   │
│                 │                             │                 │
└─────────────────┘                             └─────────────────┘
```

### Deployment Configuration

1. **Vercel Settings**
   - Auto-deployment from main branch
   - Preview deployments for PRs
   - Environment variable management
   - Edge network distribution

2. **Database Configuration**
   - Supabase for PostgreSQL hosting
   - Connection pooling enabled
   - Automatic backups
   - Read replicas for scaling

3. **Monitoring & Observability**
   - Vercel Analytics for performance
   - GTM for user analytics
   - Error tracking with Sentry (planned)
   - Uptime monitoring

### Scaling Considerations

1. **Horizontal Scaling**
   - Stateless application design
   - Database connection pooling
   - CDN for static assets

2. **Vertical Scaling**
   - Optimize database queries
   - Implement caching layers
   - Use edge functions

3. **Future Scaling Plans**
   - Redis for session storage
   - Message queue for async tasks
   - Microservices architecture

---

## Conclusion

The Karmatic architecture is designed to be scalable, secure, and maintainable. It leverages modern web technologies and best practices to deliver a high-performance application that can grow with user demands. The modular architecture allows for easy feature additions and modifications while maintaining code quality and performance standards.

For implementation details, refer to the source code and inline documentation. For API specifications, see [API.md](API.md).