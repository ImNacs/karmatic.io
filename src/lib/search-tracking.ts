import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Cookie configuration
export const SEARCH_SESSION_COOKIE = 'karmatic_search_session';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours
const DAILY_LIMIT = 1;

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

export async function getSearchLimit(identifier?: string) {
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

export async function saveSearchHistory({
  location,
  query,
  results,
  userId,
  anonymousId,
}: {
  location: string;
  query?: string;
  results?: any;
  userId?: string;
  anonymousId?: string;
}) {
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

export async function transferAnonymousSearchHistory(
  anonymousIdentifier: string,
  userId: string
) {
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