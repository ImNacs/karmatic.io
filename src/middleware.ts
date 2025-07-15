/**
 * @fileoverview Next.js middleware for authentication and route protection
 * @module middleware
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Routes that require authentication
 * @constant
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/profile(.*)',
  '/s/(.*)', // Search session routes
  '/settings(.*)',
]);

/**
 * Public API routes accessible without authentication
 * @constant
 */
const isPublicApiRoute = createRouteMatcher([
  '/api/webhook(.*)',
  '/api/public(.*)',
  '/api/search(.*)',
]);

/**
 * Public page routes accessible without authentication
 * @constant
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/explorer',
  '/pricing',
  '/about',
  '/contact',
]);

/**
 * Authentication-related routes (sign-in, sign-up)
 * @constant
 */
const isAuthRoute = createRouteMatcher([
  '/auth/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

/**
 * Main middleware function handling authentication and route protection
 * @param {Function} auth - Clerk auth function
 * @param {NextRequest} req - Next.js request object
 * @returns {NextResponse} Response with appropriate redirects or next()
 */
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

/**
 * Middleware configuration
 * @description Defines which routes trigger the middleware
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};