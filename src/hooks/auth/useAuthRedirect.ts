'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useCallback } from 'react';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
  authenticatedRedirectTo?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  
  const {
    requireAuth = false,
    redirectTo = '/auth/signin',
    redirectIfAuthenticated = false,
    authenticatedRedirectTo = '/dashboard'
  } = options;
  
  // Store current path before redirecting to auth
  const storeCurrentPath = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));
    }
  }, [pathname, searchParams]);
  
  // Redirect to auth if required
  const redirectToAuth = useCallback(() => {
    storeCurrentPath();
    const redirectUrl = `${redirectTo}?redirect_url=${encodeURIComponent(pathname)}`;
    router.push(redirectUrl);
  }, [router, redirectTo, pathname, storeCurrentPath]);
  
  // Redirect authenticated users
  const redirectAuthenticated = useCallback(() => {
    const storedPath = sessionStorage.getItem('auth_redirect');
    const redirectPath = storedPath || authenticatedRedirectTo;
    
    if (storedPath) {
      sessionStorage.removeItem('auth_redirect');
    }
    
    router.push(redirectPath);
  }, [router, authenticatedRedirectTo]);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    if (requireAuth && !isSignedIn) {
      redirectToAuth();
    } else if (redirectIfAuthenticated && isSignedIn) {
      redirectAuthenticated();
    }
  }, [isLoaded, isSignedIn, requireAuth, redirectIfAuthenticated, redirectToAuth, redirectAuthenticated]);
  
  return {
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    redirectToAuth,
    redirectAuthenticated
  };
}