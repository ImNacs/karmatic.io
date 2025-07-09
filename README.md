# Karmatic - AI-Powered Automotive Agency Discovery Platform

A modern application for discovering, analyzing, and selecting the best automotive agencies. Built with a focus on user experience inspired by Airbnb, Perplexity, Uber, and Bumble, featuring intelligent search limiting and comprehensive analytics.

## 🚀 Project Status

**Current Version:** 0.1.0  
**Stage:** Production-Ready MVP with Authentication & Search Limiting  
**Last Updated:** January 2025

### ✅ Implemented Features
- Full authentication system with Clerk
- Search limiting for anonymous users (1 search/24h)
- Database integration with Supabase/Prisma
- Google Maps/Places API integration
- GTM analytics tracking
- Responsive design with dark mode
- PWA capabilities
- Comprehensive test coverage

### 🚧 In Development
- Real-time AI chat functionality
- Advanced filtering options
- Payment integration for premium features
- Multi-language support

## ✨ Key Features

### 🔐 Authentication & User Management
- **Clerk Integration** - Secure authentication with social logins
- **User Profiles** - Personalized experience with saved searches
- **Anonymous Browsing** - Limited access without registration
- **Session Management** - Seamless transition from anonymous to authenticated

### 🔍 Smart Search System
- **Location-Based Search** - Find agencies near you with Google Places
- **Search Limiting** - Intelligent rate limiting for anonymous users:
  - 1 free search per 24 hours for anonymous users
  - Unlimited searches for registered users
  - Cookie-based session tracking
  - Automatic session transfer on sign-up
- **Auto-complete** - Real-time location suggestions
- **Geolocation Support** - One-click current location detection

### 🗺️ Interactive Mapping
- **Google Maps Integration** - Rich, interactive map experience
- **Dynamic Markers** - Color-coded by agency rating
- **Clustering** - Efficient display of multiple agencies
- **Smooth Animations** - Polished map interactions
- **Custom Info Windows** - Quick agency preview on marker click

### 📊 Agency Analytics
- **Detailed Profiles** - Comprehensive agency information
- **Rating System** - 5-star rating with visual indicators
- **Review Integration** - User reviews and testimonials
- **Comparison Mode** - Side-by-side agency comparison (up to 3)
- **AI Analysis** - Deep insights on selected agencies

### 📈 Analytics & Tracking
- **GTM Integration** - Google Tag Manager for comprehensive analytics
- **Event Tracking** - User behavior and conversion tracking
- **Performance Monitoring** - Real-time performance metrics
- **A/B Testing Ready** - Infrastructure for experimentation

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 (with native dark mode)
- **UI Components:** shadcn/ui
- **Icons:** React Icons + Lucide
- **Forms:** React Hook Form + Zod validation
- **Animations:** Motion (Framer Motion successor)
- **Maps:** @react-google-maps/api + @vis.gl/react-google-maps

### Backend & Infrastructure
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma 6
- **Authentication:** Clerk
- **API:** Next.js API Routes
- **Webhooks:** Clerk webhooks for user sync
- **Session Management:** Cookie-based with nanoid

### Development & Testing
- **Testing:** Jest + React Testing Library + Playwright
- **Package Manager:** pnpm
- **Linting:** ESLint 9
- **Type Checking:** TypeScript strict mode
- **CI/CD:** GitHub Actions (ready)

## 🚀 Installation

### Prerequisites
- Node.js 18.x or later
- pnpm 8.x or later
- PostgreSQL database (Supabase recommended)
- Clerk account
- Google Cloud Platform account (for Maps API)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/karmatic.git
cd karmatic
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://[user]:[password]@[host]:5432/postgres"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key

# GTM (optional)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
```

5. Set up the database:
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed initial data (if available)
pnpm prisma db seed
```

6. Run the development server:
```bash
pnpm dev
```

## 📱 Usage Guide

### For Anonymous Users
1. **Search** - Enter location to find agencies (1 search/24h limit)
2. **Browse** - View agencies on the interactive map
3. **Preview** - Click markers for quick agency info
4. **Sign Up** - Register to unlock unlimited searches

### For Registered Users
1. **Unlimited Search** - No restrictions on searches
2. **Save Favorites** - Bookmark agencies for later
3. **Detailed Analysis** - Access AI-powered insights
4. **Compare Agencies** - Side-by-side comparisons
5. **Search History** - Access previous searches
6. **Personalized Recommendations** - Based on search patterns

## 🏗️ Project Structure

```
karmatic/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── search/         # Search-related APIs
│   │   │   └── webhooks/       # Webhook handlers
│   │   ├── (auth)/             # Auth pages (sign-in/up)
│   │   ├── profile/            # User profile
│   │   └── layout.tsx          # Root layout
│   ├── components/              # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── auth-*.tsx          # Auth-related components
│   │   ├── agency-*.tsx        # Agency-related components
│   │   └── search-*.tsx        # Search components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   │   ├── auth/               # Auth utilities
│   │   ├── gtm/                # Analytics
│   │   └── supabase/           # Database clients
│   ├── types/                   # TypeScript definitions
│   └── middleware.ts            # Next.js middleware
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/                      # Static assets
└── tests/                       # Test files
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run E2E tests (ensure dev server is running)
pnpm test:e2e
```

## 📝 Scripts

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

## 🔒 Security Features

- **Authentication** - Secure user authentication with Clerk
- **Session Management** - HTTP-only cookies for sessions
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Zod schemas for all user inputs
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Protection** - React's built-in XSS protection
- **HTTPS Only** - Enforced in production
- **Environment Variables** - Sensitive data never exposed

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- [x] Core search functionality
- [x] Google Maps integration
- [x] User authentication
- [x] Search limiting system
- [x] Basic agency profiles

### Phase 2 (Current) 🚧
- [ ] AI-powered chat interface
- [ ] Advanced filtering options
- [ ] Premium subscription tiers
- [ ] Email notifications
- [ ] Mobile app (React Native)

### Phase 3 (Planned) 📋
- [ ] Multi-language support
- [ ] Partner agency dashboard
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] White-label solution

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Design inspiration from Airbnb, Perplexity, Uber, and Bumble
- Built with amazing open-source technologies
- Special thanks to the Next.js and React communities

---

**Note:** This is a full-stack implementation with real backend functionality. For API documentation, see [API.md](API.md). For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).
