/**
 * @fileoverview API endpoint to check user search limits
 * @module app/api/search/check-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSearchLimit, getOrCreateSearchSession, SEARCH_SESSION_COOKIE } from '@/lib/search-tracking';
import { auth } from '@clerk/nextjs/server';

/**
 * Check search limit for authenticated or anonymous users
 * @method GET
 * @returns {Promise<NextResponse>} JSON response with search limit info
 * @response {Object} 200 - Success response
 * @response {number} response.remaining - Remaining searches
 * @response {number} response.total - Total allowed searches
 * @response {boolean} response.isAuthenticated - User authentication status
 * @response {boolean} response.canSearch - Whether user can perform searches
 * @response {string} [response.sessionId] - Session ID for anonymous users
 * @response {Object} 500 - Error response
 * @example
 * // Response for authenticated user
 * {
 *   "remaining": Infinity,
 *   "total": Infinity,
 *   "isAuthenticated": true,
 *   "canSearch": true
 * }
 * 
 * // Response for anonymous user
 * {
 *   "remaining": 1,
 *   "total": 1,
 *   "isAuthenticated": false,
 *   "canSearch": true,
 *   "sessionId": "abc123"
 * }
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (userId) {
      return NextResponse.json({
        remaining: Infinity,
        total: Infinity,
        isAuthenticated: true,
        canSearch: true,
      });
    }

    // Get or create session for anonymous user
    const sessionId = await getOrCreateSearchSession();
    const limit = await getSearchLimit(sessionId);
    
    const response = NextResponse.json({
      ...limit,
      canSearch: limit.remaining > 0,
      sessionId,
    });
    
    // Ensure cookie is set in response
    response.cookies.set(SEARCH_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error checking search limit:', error);
    return NextResponse.json(
      { error: 'Failed to check search limit' },
      { status: 500 }
    );
  }
}