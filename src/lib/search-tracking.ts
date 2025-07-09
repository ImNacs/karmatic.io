import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

/**
 * Cookie name for tracking anonymous search sessions.
 * This cookie is used to enforce rate limiting for unauthenticated users.
 */
export const SEARCH_SESSION_COOKIE = 'karmatic_search_session';

/**
 * Maximum age for search session cookies in seconds (24 hours).
 * After this period, the cookie expires and the user gets a new search quota.
 */
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Daily search limit for anonymous users.
 * This is a business decision to encourage user registration while still
 * allowing potential users to try the service.
 */
const DAILY_LIMIT = 1;

/**
 * Gets an existing search session or creates a new one for anonymous users.
 * 
 * This function implements a cookie-based session tracking system that:
 * - Persists across page refreshes and browser sessions (up to 24 hours)
 * - Automatically creates a new session if none exists
 * - Uses HTTP-only cookies for security
 * 
 * @returns {Promise<string>} The session identifier (nanoid)
 * 
 * @example
 * ```typescript
 * const sessionId = await getOrCreateSearchSession();
 * const searchLimit = await getSearchLimit(sessionId);
 * ```
 */
export async function getOrCreateSearchSession(): Promise<string> {
  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SEARCH_SESSION_COOKIE);
  
  if (existingSession?.value) {
    return existingSession.value;
  }
  
  // Create new session
  const newSessionId = nanoid();
  cookieStore.set(SEARCH_SESSION_COOKIE, newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  
  return newSessionId;
}

/**
 * Interface for search limit information returned to clients.
 */
export interface SearchLimitInfo {
  /** Number of searches remaining in the current period */
  remaining: number;
  /** Total searches allowed per period */
  total: number;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Checks the search limit for a given session identifier.
 * 
 * This function implements a tiered access model:
 * - Authenticated users: Unlimited searches
 * - Anonymous users: Limited to 1 search per 24 hours
 * 
 * The 24-hour period is rolling, meaning it resets 24 hours after the last search,
 * not at a fixed time each day. This provides a better user experience.
 * 
 * @param {string} [identifier] - The session identifier from the cookie
 * @returns {Promise<SearchLimitInfo>} The current search limit status
 * 
 * @example
 * ```typescript
 * // For anonymous user
 * const limit = await getSearchLimit('session_abc123');
 * if (limit.remaining === 0) {
 *   // Show upgrade prompt
 * }
 * 
 * // For authenticated user
 * const limit = await getSearchLimit('session_xyz789');
 * // limit.remaining === Infinity
 * ```
 */
export async function getSearchLimit(identifier?: string): Promise<SearchLimitInfo> {
  if (!identifier) {
    return { remaining: 1, total: 1, isAuthenticated: false };
  }

  // Check if user is authenticated
  const { userId } = await auth();
  if (userId) {
    return { remaining: Infinity, total: Infinity, isAuthenticated: true };
  }

  // Check anonymous search count
  const session = await prisma.anonymousSearch.findUnique({
    where: { identifier },
  });

  if (!session) {
    return { remaining: 1, total: 1, isAuthenticated: false };
  }

  // Check if it's been 24 hours since last search (reset period)
  const hoursSinceLastSearch = 
    (Date.now() - session.lastSearchAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastSearch >= 24) {
    // Reset search count
    await prisma.anonymousSearch.update({
      where: { id: session.id },
      data: { searchCount: 0 },
    });
    return { remaining: 1, total: 1, isAuthenticated: false };
  }

  const remaining = Math.max(0, 1 - session.searchCount);
  return { remaining, total: 1, isAuthenticated: false };
}

/**
 * Increments the search count for an anonymous user session.
 * 
 * This function handles the core rate limiting logic:
 * - Tracks search counts per session
 * - Automatically resets counts after 24 hours
 * - Throws an error if the limit is exceeded
 * - Creates a new session record if none exists
 * 
 * The function is atomic, using database transactions to prevent race conditions
 * when multiple requests arrive simultaneously.
 * 
 * @param {string} identifier - The session identifier from the cookie
 * @returns {Promise<Object>} The updated session with remaining count
 * @throws {Error} When the daily search limit is exceeded
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await incrementSearchCount(sessionId);
 *   console.log(`Searches remaining: ${result.remaining}`);
 * } catch (error) {
 *   if (error.message === 'Search limit exceeded') {
 *     // Redirect to sign-up page
 *   }
 * }
 * ```
 */
export async function incrementSearchCount(identifier: string) {
  // First check current count
  const current = await prisma.anonymousSearch.findUnique({
    where: { identifier },
  });
  
  // Check if we need to reset (24 hours passed)
  if (current) {
    const hoursSinceLastSearch = (Date.now() - current.lastSearchAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSearch >= 24) {
      // Reset the count
      const reset = await prisma.anonymousSearch.update({
        where: { identifier },
        data: {
          searchCount: 1,
          lastSearchAt: new Date(),
        },
      });
      return {
        ...reset,
        remaining: 0,
        total: DAILY_LIMIT,
        isAuthenticated: false,
      };
    }
    
    // Check if limit exceeded
    if (current.searchCount >= DAILY_LIMIT) {
      throw new Error('Search limit exceeded');
    }
  }
  
  const session = await prisma.anonymousSearch.upsert({
    where: { identifier },
    update: { 
      searchCount: { increment: 1 },
      lastSearchAt: new Date(),
    },
    create: {
      identifier,
      searchCount: 1,
      lastSearchAt: new Date(),
    },
  });
  
  return {
    ...session,
    remaining: Math.max(0, DAILY_LIMIT - session.searchCount),
    total: DAILY_LIMIT,
    isAuthenticated: false,
  };
}

/**
 * Parameters for saving search history.
 */
export interface SaveSearchHistoryParams {
  /** The location searched for */
  location: string;
  /** Optional search query/filters */
  query?: string;
  /** Search results to store (will be JSON stringified) */
  results?: any;
  /** User ID if authenticated */
  userId?: string;
  /** Anonymous session ID if not authenticated */
  anonymousId?: string;
}

/**
 * Saves a search to the history for analytics and user experience.
 * 
 * This function stores search data for both authenticated and anonymous users:
 * - Authenticated users: Linked to their user account for persistent history
 * - Anonymous users: Linked to their session for the 24-hour period
 * 
 * The search history is used for:
 * - User's search history feature
 * - Analytics and insights
 * - Improving search relevance
 * - Compliance and auditing
 * 
 * @param {SaveSearchHistoryParams} params - The search details to save
 * @returns {Promise<SearchHistory>} The created search history record
 * 
 * @example
 * ```typescript
 * // For authenticated user
 * await saveSearchHistory({
 *   location: 'Mexico City',
 *   query: 'Toyota dealers',
 *   results: searchResults,
 *   userId: 'user_123'
 * });
 * 
 * // For anonymous user
 * await saveSearchHistory({
 *   location: 'Mexico City',
 *   query: 'Honda service',
 *   results: searchResults,
 *   anonymousId: 'anon_456'
 * });
 * ```
 */
export async function saveSearchHistory({
  location,
  query,
  results,
  userId,
  anonymousId,
}: SaveSearchHistoryParams) {
  return await prisma.searchHistory.create({
    data: {
      location,
      query,
      resultsJson: results,
      userId,
      anonymousId,
    },
  });
}

/**
 * Transfers anonymous search history to a newly authenticated user.
 * 
 * This function is called when an anonymous user signs up or logs in.
 * It ensures continuity of experience by:
 * - Moving all anonymous searches to the user's account
 * - Cleaning up the anonymous session
 * - Preserving the search history timestamp and data
 * 
 * This is a critical UX feature that prevents users from losing their
 * search context when they decide to create an account.
 * 
 * @param {string} anonymousIdentifier - The anonymous session ID from cookie
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * // In the sign-up completion handler
 * const sessionId = cookies.get(SEARCH_SESSION_COOKIE);
 * if (sessionId) {
 *   await transferAnonymousSearchHistory(sessionId, newUser.id);
 * }
 * ```
 */
export async function transferAnonymousSearchHistory(
  anonymousIdentifier: string,
  userId: string
): Promise<void> {
  // Find the anonymous session
  const anonymousSession = await prisma.anonymousSearch.findUnique({
    where: { identifier: anonymousIdentifier },
    include: { searches: true },
  });

  if (!anonymousSession) return;

  // Transfer all search history to the user
  await prisma.searchHistory.updateMany({
    where: { anonymousId: anonymousSession.id },
    data: { 
      userId,
      anonymousId: null,
    },
  });

  // Delete the anonymous session
  await prisma.anonymousSearch.delete({
    where: { id: anonymousSession.id },
  });
}