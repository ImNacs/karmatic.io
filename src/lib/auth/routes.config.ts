/**
 * Authentication and routing configuration
 */

export const AUTH_ROUTES = {
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
  SIGN_OUT: '/auth/signout',
  CALLBACK: '/auth/callback',
  VERIFY_EMAIL: '/verify-email',
  UNAUTHORIZED: '/unauthorized',
} as const;

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/history',
  '/profile',
  '/settings',
  '/admin',
  '/s/:sessionId/analysis',
] as const;

export const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/search',
  '/explorer',
] as const;

export const API_ROUTES = {
  AUTH: {
    SYNC_USER: '/api/auth/sync-user',
    CHECK_SESSION: '/api/auth/check-session',
  },
  SEARCH: {
    CREATE: '/api/search/create',
    CHECK_LIMIT: '/api/search/check-limit',
    TRACK: '/api/search/track',
  },
  SESSION: {
    CREATE: '/api/session/create',
    GET: '/api/session/:id',
    UPDATE: '/api/session/:id',
    DELETE: '/api/session/:id',
  }
} as const;

export const ROUTE_PATTERNS = {
  SESSION: /^\/s\/[a-zA-Z0-9-]+$/,
  SESSION_ANALYSIS: /^\/s\/[a-zA-Z0-9-]+\/analysis$/,
  SESSION_AGENCY: /^\/s\/[a-zA-Z0-9-]+\/agency\/[a-zA-Z0-9-]+$/,
} as const;

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.includes(':')) {
      // Handle dynamic routes
      const pattern = route.replace(/:[\w]+/g, '[\\w-]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

/**
 * Get the appropriate redirect URL after authentication
 */
export function getPostAuthRedirect(
  requestedUrl?: string | null,
  defaultUrl: string = '/dashboard'
): string {
  if (!requestedUrl) return defaultUrl;
  
  // Don't redirect to auth routes
  if (requestedUrl.startsWith('/auth/') || 
      requestedUrl.startsWith('/sign-')) {
    return defaultUrl;
  }
  
  // Validate the URL is internal
  try {
    const url = new URL(requestedUrl, 'http://localhost');
    if (url.hostname !== 'localhost') {
      return defaultUrl;
    }
  } catch {
    // If it's not a valid URL, assume it's a path
  }
  
  return requestedUrl;
}