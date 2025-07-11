import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define which routes should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/profile(.*)',
  '/s/(.*)', // Search session routes
  '/settings(.*)',
]);

// Define public API routes that should not require authentication
const isPublicApiRoute = createRouteMatcher([
  '/api/webhook(.*)',
  '/api/public(.*)',
  '/api/search(.*)',
]);

// Define public page routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/explorer',
  '/pricing',
  '/about',
  '/contact',
]);

// Define auth routes
const isAuthRoute = createRouteMatcher([
  '/auth/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;
  
  // Handle auth route redirects
  if (isAuthRoute(req) && userId) {
    const redirectUrl = req.nextUrl.searchParams.get('redirect_url') || '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  
  // Skip protection for public routes
  if (isPublicRoute(req) || isPublicApiRoute(req)) {
    return NextResponse.next();
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Allow the request to continue
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};