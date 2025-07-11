import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface RouteGuardOptions {
  redirectTo?: string;
  allowedRoles?: string[];
  requireVerified?: boolean;
}

/**
 * Protects a route by requiring authentication
 */
export async function requireAuth(options: RouteGuardOptions = {}) {
  const { redirectTo = '/auth/signin' } = options;
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    // Store the current URL to redirect back after auth
    const currentUrl = new URL(globalThis.location?.href || '');
    const cookieStore = cookies();
    cookieStore.set('auth_redirect', currentUrl.pathname + currentUrl.search, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });
    
    redirect(`${redirectTo}?redirect_url=${encodeURIComponent(currentUrl.pathname)}`);
  }
  
  // Check for required roles
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    const userRoles = sessionClaims?.roles as string[] || [];
    const hasRequiredRole = options.allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      redirect('/unauthorized');
    }
  }
  
  // Check for email verification
  if (options.requireVerified && !sessionClaims?.email_verified) {
    redirect('/verify-email');
  }
  
  return { userId, sessionClaims };
}

/**
 * Redirects authenticated users away from auth pages
 */
export async function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { userId } = await auth();
  
  if (userId) {
    redirect(redirectTo);
  }
}