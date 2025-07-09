# Karmatic API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL & Headers](#base-url--headers)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Search Endpoints](#search-endpoints)
  - [Agency Endpoints](#agency-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Webhook Endpoints](#webhook-endpoints)
- [Examples](#examples)
- [Testing](#testing)

## Overview

The Karmatic API is a RESTful API built with Next.js API Routes. It provides endpoints for user authentication, agency search, search limiting, and user management. All responses are in JSON format.

### Key Features
- JWT-based authentication via Clerk
- Intelligent rate limiting for anonymous users
- Comprehensive error handling
- Type-safe with TypeScript
- Webhook support for real-time updates

## Authentication

Karmatic uses Clerk for authentication. Most endpoints require authentication via Bearer token.

### Authentication Methods

1. **Bearer Token** (Recommended)
   ```
   Authorization: Bearer <jwt_token>
   ```

2. **Session Cookie** (Web only)
   - Automatically handled by Clerk in browser
   - HTTP-only secure cookie

### Getting a Token

Tokens are automatically provided by Clerk after authentication:

```typescript
// Client-side
import { useAuth } from '@clerk/nextjs';

const { getToken } = useAuth();
const token = await getToken();
```

## Base URL & Headers

### Base URL
```
Production: https://karmatic.io/api
Development: http://localhost:3000/api
```

### Required Headers
```
Content-Type: application/json
Accept: application/json
```

### Optional Headers
```
Authorization: Bearer <token>  // For authenticated requests
X-Request-ID: <uuid>          // For request tracking
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-01-09T12:00:00Z",
    "version": "1.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    }
  }
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_INPUT` | Request validation failed | Check request format |
| `UNAUTHORIZED` | Authentication required | Provide valid token |
| `FORBIDDEN` | Access denied | Check permissions |
| `NOT_FOUND` | Resource not found | Verify resource ID |
| `RATE_LIMITED` | Too many requests | Wait before retrying |
| `SEARCH_LIMIT_EXCEEDED` | Daily search limit reached | Sign up for unlimited |
| `INTERNAL_ERROR` | Server error | Contact support |

## Rate Limiting

### Anonymous Users
- **Search Limit**: 1 search per 24 hours
- **Reset**: 24 hours from last search
- **Tracking**: Cookie-based session

### Authenticated Users
- **Search Limit**: Unlimited
- **API Rate Limit**: 100 requests per minute
- **Burst Limit**: 20 requests per second

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704805200
```

## API Endpoints

### Authentication Endpoints

#### Sync User Data
Synchronizes Clerk user data with the database.

```
POST /api/auth/sync-user
```

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "userId": "user_2abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clh123456",
      "clerkUserId": "user_2abc123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-01-09T12:00:00Z"
    }
  }
}
```

### Search Endpoints

#### Check Search Limit
Check the current search limit status for the user.

```
GET /api/search/check-limit
```

**Authentication**: Optional

**Response**:
```json
{
  "success": true,
  "data": {
    "remaining": 1,
    "total": 1,
    "isAuthenticated": false,
    "canSearch": true,
    "resetAt": "2025-01-10T12:00:00Z"
  }
}
```

#### Track Search
Records a search action and updates the limit counter.

```
POST /api/search/track
```

**Authentication**: Optional

**Request Body**:
```json
{
  "location": "Mexico City",
  "query": "Toyota dealers",
  "coordinates": {
    "lat": 19.4326,
    "lng": -99.1332
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "searchId": "search_123",
    "remaining": 0,
    "total": 1,
    "nextResetAt": "2025-01-10T12:00:00Z"
  }
}
```

**Error Response (Limit Exceeded)**:
```json
{
  "success": false,
  "error": {
    "code": "SEARCH_LIMIT_EXCEEDED",
    "message": "Daily search limit reached. Sign up for unlimited searches.",
    "details": {
      "resetAt": "2025-01-10T12:00:00Z",
      "upgradeUrl": "/sign-up"
    }
  }
}
```

### Agency Endpoints

#### Search Agencies
Search for automotive agencies based on location and criteria.

```
POST /api/agencies/search
```

**Authentication**: Optional (affects rate limits)

**Request Body**:
```json
{
  "location": {
    "address": "Mexico City, Mexico",
    "coordinates": {
      "lat": 19.4326,
      "lng": -99.1332
    }
  },
  "radius": 5000,  // meters
  "filters": {
    "brands": ["Toyota", "Honda"],
    "services": ["sales", "service"],
    "minRating": 4.0
  },
  "limit": 20,
  "offset": 0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "agencies": [
      {
        "id": "agency_123",
        "name": "Toyota City Center",
        "address": "123 Main St, Mexico City",
        "coordinates": {
          "lat": 19.4326,
          "lng": -99.1332
        },
        "rating": 4.5,
        "reviewCount": 234,
        "distance": 1200,
        "brands": ["Toyota"],
        "services": ["sales", "service", "parts"],
        "hours": {
          "monday": { "open": "09:00", "close": "19:00" },
          // ... other days
        },
        "contact": {
          "phone": "+52 55 1234 5678",
          "website": "https://toyota-city.mx",
          "email": "info@toyota-city.mx"
        },
        "images": [
          {
            "url": "https://...",
            "caption": "Showroom"
          }
        ]
      }
      // ... more agencies
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "meta": {
    "searchId": "search_456",
    "cached": false,
    "timestamp": "2025-01-09T12:00:00Z"
  }
}
```

#### Get Agency Details
Get detailed information about a specific agency.

```
GET /api/agencies/:id
```

**Authentication**: Optional

**Parameters**:
- `id` - Agency ID

**Response**:
```json
{
  "success": true,
  "data": {
    "agency": {
      "id": "agency_123",
      "name": "Toyota City Center",
      "description": "Premier Toyota dealership...",
      "address": "123 Main St, Mexico City",
      "coordinates": {
        "lat": 19.4326,
        "lng": -99.1332
      },
      "rating": 4.5,
      "reviewCount": 234,
      "brands": ["Toyota"],
      "services": ["sales", "service", "parts"],
      "certifications": ["Toyota Certified", "ISO 9001"],
      "established": "1995",
      "hours": {
        "monday": { "open": "09:00", "close": "19:00" },
        // ... other days
      },
      "contact": {
        "phone": "+52 55 1234 5678",
        "website": "https://toyota-city.mx",
        "email": "info@toyota-city.mx",
        "whatsapp": "+52 55 1234 5678"
      },
      "images": [
        {
          "url": "https://...",
          "caption": "Showroom",
          "type": "interior"
        }
      ],
      "reviews": {
        "average": 4.5,
        "distribution": {
          "5": 150,
          "4": 60,
          "3": 15,
          "2": 5,
          "1": 4
        },
        "recent": [
          {
            "id": "review_123",
            "author": "John D.",
            "rating": 5,
            "comment": "Excellent service...",
            "date": "2025-01-05T10:00:00Z"
          }
        ]
      },
      "features": [
        "Free WiFi",
        "Kids Play Area",
        "Certified Technicians",
        "Loaner Vehicles"
      ]
    }
  }
}
```

### User Endpoints

#### Get User Profile
Get the authenticated user's profile.

```
GET /api/user/profile
```

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "imageUrl": "https://...",
      "plan": "free",
      "searchHistory": [
        {
          "id": "search_123",
          "location": "Mexico City",
          "query": "Toyota",
          "createdAt": "2025-01-09T10:00:00Z"
        }
      ],
      "stats": {
        "totalSearches": 15,
        "favoriteAgencies": 3,
        "lastActive": "2025-01-09T11:00:00Z"
      }
    }
  }
}
```

#### Update User Profile
Update user profile information.

```
PATCH /api/user/profile
```

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+52 55 1234 5678"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

### Webhook Endpoints

#### Clerk User Webhook
Handles user lifecycle events from Clerk.

```
POST /api/webhooks/clerk
```

**Authentication**: Webhook signature verification

**Headers**:
```
svix-id: msg_123
svix-timestamp: 1704805200
svix-signature: v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=
```

**Request Body**:
```json
{
  "data": {
    "id": "user_2abc123",
    "email_addresses": [
      {
        "email_address": "user@example.com",
        "verification": {
          "status": "verified"
        }
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://..."
  },
  "type": "user.created"  // or user.updated, user.deleted
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "User synced successfully"
  }
}
```

## Examples

### Complete Search Flow

#### 1. Check Search Limit
```bash
curl -X GET https://karmatic.io/api/search/check-limit \
  -H "Content-Type: application/json"
```

#### 2. Perform Search
```bash
curl -X POST https://karmatic.io/api/agencies/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "address": "Mexico City",
      "coordinates": {
        "lat": 19.4326,
        "lng": -99.1332
      }
    },
    "radius": 5000
  }'
```

#### 3. Track Search
```bash
curl -X POST https://karmatic.io/api/search/track \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Mexico City",
    "query": "Toyota"
  }'
```

### Authenticated Request Example

```typescript
// Using fetch with Clerk token
const token = await getToken();

const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Error Handling Example

```typescript
try {
  const response = await fetch('/api/agencies/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchData)
  });

  const result = await response.json();

  if (!result.success) {
    // Handle API error
    if (result.error.code === 'SEARCH_LIMIT_EXCEEDED') {
      // Redirect to sign up
      router.push('/sign-up');
    } else {
      // Show error message
      toast.error(result.error.message);
    }
  } else {
    // Process successful response
    setAgencies(result.data.agencies);
  }
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
  toast.error('Connection error. Please try again.');
}
```

## Testing

### Test Endpoints

The API includes test endpoints for development:

```
GET /api/test-auth
```

Tests authentication and returns user info.

### Using cURL

```bash
# Test authentication
curl -X GET https://karmatic.io/api/test-auth \
  -H "Authorization: Bearer <token>"

# Test search limit
curl -X GET https://karmatic.io/api/search/check-limit \
  -b "karmatic_search_session=test_session_123"
```

### Postman Collection

A Postman collection is available for testing all endpoints:
[Download Postman Collection](https://karmatic.io/api-docs/postman-collection.json)

### Rate Limit Testing

To test rate limiting:

1. Clear cookies
2. Make a search request
3. Try another search (should be blocked)
4. Wait 24 hours or sign up
5. Verify unlimited access

---

## Best Practices

### Request Guidelines

1. **Always include proper headers**
   - Set `Content-Type: application/json`
   - Include authentication when required

2. **Handle errors gracefully**
   - Check response status
   - Parse error messages
   - Implement retry logic for 5xx errors

3. **Respect rate limits**
   - Monitor rate limit headers
   - Implement exponential backoff
   - Cache responses when appropriate

4. **Security considerations**
   - Never expose API tokens in client code
   - Validate all input data
   - Use HTTPS in production

### Response Caching

Some endpoints support caching:

- Agency details: Cache for 1 hour
- Search results: Cache for 15 minutes
- User profile: No caching

### Pagination

For endpoints returning lists:

```
?limit=20&offset=0
```

Maximum limit: 100 items per request

---

For additional support or questions about the API, please contact support@karmatic.io