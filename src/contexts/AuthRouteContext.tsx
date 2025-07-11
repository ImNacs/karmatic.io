'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface AuthRouteContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  redirectToAuth: (returnUrl?: string) => void;
  redirectToProtected: (url: string) => void;
  handlePostAuth: () => void;
  storedRedirectUrl: string | null;
}

const AuthRouteContext = createContext<AuthRouteContextValue | null>(null);

export function AuthRouteProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedRedirectUrl, setStoredRedirectUrl] = useState<string | null>(null);
  
  // Load stored redirect URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('auth_redirect');
      if (stored) {
        setStoredRedirectUrl(stored);
      }
    }
  }, []);
  
  // Redirect to auth with return URL
  const redirectToAuth = (returnUrl?: string) => {
    const url = returnUrl || pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Store the return URL
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', url);
    }
    
    // Redirect to sign-in with return URL parameter
    router.push(`/auth/signin?redirect_url=${encodeURIComponent(url)}`);
  };
  
  // Redirect to a protected route (will trigger auth if needed)
  const redirectToProtected = (url: string) => {
    if (isSignedIn) {
      router.push(url);
    } else {
      redirectToAuth(url);
    }
  };
  
  // Handle post-authentication redirect
  const handlePostAuth = () => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('auth_redirect');
      if (stored) {
        sessionStorage.removeItem('auth_redirect');
        router.push(stored);
      } else {
        router.push('/dashboard');
      }
    }
  };
  
  const value: AuthRouteContextValue = {
    isAuthenticated: !!isSignedIn,
    isLoading: !isLoaded,
    redirectToAuth,
    redirectToProtected,
    handlePostAuth,
    storedRedirectUrl
  };
  
  return (
    <AuthRouteContext.Provider value={value}>
      {children}
    </AuthRouteContext.Provider>
  );
}

export function useAuthRoute() {
  const context = useContext(AuthRouteContext);
  if (!context) {
    throw new Error('useAuthRoute must be used within AuthRouteProvider');
  }
  return context;
}