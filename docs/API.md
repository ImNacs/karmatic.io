# Karmatic API Documentation

## Overview

The Karmatic API provides endpoints for searching automotive agencies, managing search history, and handling user authentication. All API routes are built on Next.js API Routes and follow RESTful conventions.

## Base URL

```
Production: https://karmatic.io/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints support both authenticated and anonymous users:
- **Authenticated users**: Use Clerk authentication tokens
- **Anonymous users**: Use cookie-based session tracking

## Endpoints

### Search Management

#### Save Search
```http
POST /api/search/save
```

Saves a new search to the database and returns a unique search ID.

**Request Body:**
```json
{
  "location": "San Francisco, CA",
  "query": "insurance agencies", 
  "placeId": "ChIJIQBpAG2ahYAR_6128GcTUEo",
  "coordinates": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "results": [
    // Array of agency results (optional)
  ]
}
```

**Response:**
```json
{
  "searchId": "cmcyco1xq0001ctt04nqsvd6j",
  "success": true
}
```

**Status Codes:**
- `200`: Success
- `500`: Database error

---

#### Get Search History
```http
GET /api/search/history
```

Retrieves the user's search history grouped by date.

**Response:**
```json
{
  "searches": [
    {
      "label": "Hoy",
      "searches": [
        {
          "id": "cmcyco1xq0001ctt04nqsvd6j",
          "location": "San Francisco, CA",
          "query": "insurance agencies",
          "createdAt": "2025-01-11T10:30:00.000Z"
        }
      ]
    },
    {
      "label": "Ayer",
      "searches": [...]
    }
  ],
  "total": 15
}
```

**Notes:**
- Authenticated users: Returns last 50 searches
- Anonymous users: Returns last 20 searches
- Automatically filters out soft-deleted items

---

#### Delete Search (Soft Delete)
```http
DELETE /api/search/history/[id]
```

Soft deletes a search from history (can be recovered within 30 days).

**Parameters:**
- `id`: Search ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Search history deleted successfully"
}
```

**Status Codes:**
- `200`: Success
- `403`: Unauthorized (not owner)
- `404`: Search not found
- `500`: Server error

---

#### Restore Deleted Search
```http
POST /api/search/history/[id]/restore
```

Restores a soft-deleted search.

**Parameters:**
- `id`: Search ID to restore

**Response:**
```json
{
  "success": true,
  "message": "Search history restored successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Search not deleted
- `403`: Unauthorized
- `404`: Search not found

---

### Search Limiting

#### Check Search Limit
```http
GET /api/search/check-limit
```

Checks if the user can perform a search.

**Response:**
```json
{
  "canSearch": true,
  "isAuthenticated": false,
  "remainingSearches": 0,
  "nextAvailableAt": "2025-01-12T10:30:00.000Z",
  "message": "You have 0 searches remaining"
}
```

---

#### Track Search
```http
POST /api/search/track
```

Records a search for rate limiting purposes.

**Request Body:**
```json
{
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "remainingSearches": 0,
  "nextAvailableAt": "2025-01-12T10:30:00.000Z"
}
```

---

### Authentication

#### Sync User
```http
POST /api/auth/sync-user
```

Syncs Clerk user data with the database (called automatically by webhooks).

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### Maintenance

#### Cleanup Soft-Deleted Records
```http
POST /api/search/cleanup
```

Permanently deletes records that were soft-deleted more than 30 days ago.

**Headers:**
```
Authorization: Bearer YOUR_CLEANUP_SECRET_KEY
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 5,
  "message": "Successfully cleaned up 5 old records"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

#### Get Cleanup Status
```http
GET /api/search/cleanup
```

Gets the status of soft-deleted records pending cleanup.

**Response:**
```json
{
  "pendingCleanup": 3,
  "totalSoftDeleted": 10,
  "cleanupThresholdDays": 30
}
```

---

### External Services

#### Google Places Autocomplete
```http
GET /api/google-places/autocomplete?input=San+Francisco
```

Returns location suggestions from Google Places.

**Query Parameters:**
- `input`: Search query (required)

**Response:**
```json
{
  "predictions": [
    {
      "description": "San Francisco, CA, USA",
      "place_id": "ChIJIQBpAG2ahYAR_6128GcTUEo",
      "structured_formatting": {
        "main_text": "San Francisco",
        "secondary_text": "CA, USA"
      }
    }
  ]
}
```

---

#### Google Places Details
```http
GET /api/google-places/details/[placeId]
```

Gets detailed information about a specific place.

**Parameters:**
- `placeId`: Google Place ID

**Response:**
```json
{
  "result": {
    "name": "San Francisco",
    "geometry": {
      "location": {
        "lat": 37.7749,
        "lng": -122.4194
      }
    },
    "formatted_address": "San Francisco, CA, USA"
  }
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "details": {} // Optional, only in development
}
```

## Rate Limiting

- **Anonymous users**: 1 search per 24 hours
- **Authenticated users**: Unlimited searches
- Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Data Retention

- **Search History**: Retained indefinitely for active users
- **Soft-Deleted Items**: Retained for 30 days before permanent deletion
- **Anonymous Sessions**: Cookie expires after 1 year

## Webhooks

### Clerk User Events
```http
POST /api/webhooks/clerk
```

Handles Clerk webhook events for user synchronization.

**Events Handled:**
- `user.created`
- `user.updated`
- `user.deleted`

**Security:**
- Webhook signature verification using `CLERK_WEBHOOK_SECRET`

---

## Best Practices

1. **Always handle errors**: Check response status and handle errors appropriately
2. **Use optimistic updates**: Update UI immediately for better UX
3. **Respect rate limits**: Check limits before making requests
4. **Cache when possible**: Use SWR or similar for data fetching
5. **Validate inputs**: Always validate user inputs before sending

## SDK Example

```typescript
// Example using fetch
async function saveSearch(searchData) {
  try {
    const response = await fetch('/api/search/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      throw new Error('Failed to save search');
    }

    const { searchId } = await response.json();
    return searchId;
  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
}
```

---

For more information or to report issues, please visit our [GitHub repository](https://github.com/karmatic).