# Migration Documentation: Standard Model Implementation

## Overview
This document describes the migration from a unified `documents` table to the industry-standard conversation/messages pattern.

## Data Model Changes

### Previous Model (Unified Documents)
- Single `documents` table with JSON metadata
- Mixed concerns (search, chat, agencies) in one table
- Complex queries for conversation retrieval

### New Model (Standard Pattern)
```sql
conversations
├── id (string, cuid)
├── user_id (bigint, nullable)
├── session_id (string, nullable)
├── title (string, nullable)
├── metadata (json)
├── created_at
├── updated_at
└── deleted_at (soft delete)

messages
├── id (bigint, auto-increment)
├── conversation_id (string, FK)
├── content (text)
├── role (string)
├── message_index (int)
├── metadata (json)
└── created_at
```

## Metadata Structure

### Message Metadata for Search
```json
{
  "search": {
    "location": "Mexico City",
    "query": "Toyota dealers",
    "isInitial": true
  },
  "lat": 19.4326,
  "lng": -99.1332,
  "results": {
    "agencies": [...],
    "coordinates": {...},
    // Other search results
  }
}
```

### Key Design Decisions

1. **Search as First Message**: Each search creates a conversation with the search query as the first message
2. **Flat Coordinate Storage**: `lat` and `lng` are stored at the root level of metadata for easy access
3. **Results Preservation**: Full search results are stored in the `results` field
4. **Soft Deletes**: Conversations can be soft-deleted via `deleted_at`

## Migration Steps Applied

1. Created new tables via Prisma schema
2. Created SQL functions to maintain API compatibility
3. Updated all code to use new data model
4. Applied custom SQL functions for complex queries

## SQL Functions Created

- `get_search_history`: Retrieve user's search history
- `check_anonymous_search_limit`: Rate limiting for anonymous users
- `save_initial_search`: Create conversation and first message
- `get_conversation_messages`: Retrieve full conversation
- `transfer_anonymous_history`: Transfer anonymous searches to authenticated user

## Benefits

1. **Performance**: Optimized indexes for conversation/message queries
2. **Scalability**: Standard pattern proven at scale by major AI companies
3. **Flexibility**: Easy to add new message types and metadata
4. **Maintainability**: Clear separation of concerns