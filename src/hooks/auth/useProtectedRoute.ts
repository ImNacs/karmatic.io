'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  allowedRoles?: string[];
  requireVerified?: boolean;
  fallback?: React.ReactNode;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { isSignedIn, isLoaded, sessionClaims } = useAuth();
  const router = useRouter();
  const { 
    redirectTo = '/auth/signin',
    allowedRoles = [],
    requireVerified = false 
  } = options;
  
  useEffect(() => {
    if (!isLoaded) return;
    
    // Check authentication
    if (!isSignedIn) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`${redirectTo}?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    // Check roles
    if (allowedRoles.length > 0) {
      const userRoles = (sessionClaims?.roles as string[]) || [];
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
    
    // Check email verification
    if (requireVerified && !sessionClaims?.email_verified) {
      router.push('/verify-email');
      return;
    }
  }, [isLoaded, isSignedIn, sessionClaims, router, redirectTo, allowedRoles, requireVerified]);
  
  return {
    isAuthorized: isSignedIn && isLoaded,
    isLoading: !isLoaded,
    sessionClaims
  };
}