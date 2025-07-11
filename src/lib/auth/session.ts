import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { cache } from 'react';

export interface SessionData {
  userId: string | null;
  user: any | null;
  isAuthenticated: boolean;
  searchLimit?: {
    remaining: number;
    resetAt: Date;
  };
}

/**
 * Get the current session data (cached per request)
 */
export const getSession = cache(async (): Promise<SessionData> => {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  
  // Get search limits for the user
  let searchLimit;
  if (userId) {
    // For authenticated users, check database limits
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search/check-limit`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        searchLimit = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch search limits:', error);
    }
  } else {
    // For anonymous users, check cookie-based limits
    const cookieStore = cookies();
    const lastSearch = cookieStore.get('last_search')?.value;
    
    if (lastSearch) {
      const lastSearchTime = new Date(lastSearch);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      searchLimit = {
        remaining: lastSearchTime > dayAgo ? 0 : 1,
        resetAt: new Date(lastSearchTime.getTime() + 24 * 60 * 60 * 1000)
      };
    } else {
      searchLimit = {
        remaining: 1,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }
  }
  
  return {
    userId,
    user,
    isAuthenticated: !!userId,
    searchLimit
  };
});

/**
 * Store the current path for post-auth redirect
 */
export async function storeRedirectPath(path: string) {
  const cookieStore = cookies();
  cookieStore.set('auth_redirect', path, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  });
}

/**
 * Get and clear the stored redirect path
 */
export async function getAndClearRedirectPath(): Promise<string | null> {
  const cookieStore = cookies();
  const redirectPath = cookieStore.get('auth_redirect')?.value || null;
  
  if (redirectPath) {
    cookieStore.delete('auth_redirect');
  }
  
  return redirectPath;
}