import { NextRequest, NextResponse } from 'next/server';
import { incrementSearchCount, getOrCreateSearchSession, SEARCH_SESSION_COOKIE } from '@/lib/search-tracking';
import { auth } from '@clerk/nextjs/server';
import { trackEvent } from '@/lib/gtm/gtm';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { location, query } = await request.json();
    
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (userId) {
      // Authenticated users have unlimited searches, just track for analytics
      // Track authenticated user search
      await prisma.searchHistory.create({
        data: {
          userId,
          location,
          query: query || null,
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        remaining: Infinity,
        isAuthenticated: true 
      });
    }
    
    // For anonymous users, increment search count
    const sessionId = await getOrCreateSearchSession();
    const result = await incrementSearchCount(sessionId);
    
    // Track the successful search
    trackEvent.searchCompleted(location, query || undefined, false);
    
    const response = NextResponse.json({
      success: true,
      ...result,
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
    console.error('Error tracking search:', error);
    return NextResponse.json(
      { error: 'Failed to track search' },
      { status: 500 }
    );
  }
}