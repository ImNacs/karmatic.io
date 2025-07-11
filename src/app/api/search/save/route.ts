import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, query, placeId, coordinates, results } = body
    
    // Get user authentication status
    const { userId } = await auth()
    
    let anonymousId = null
    let dbUserId = null
    
    // Check if authenticated user exists in database
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { clerkUserId: userId }
        })
        
        if (user) {
          dbUserId = user.id
        } else {
          // User not synced yet, try to sync
          const syncResponse = await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              // Forward auth headers
              'Cookie': request.headers.get('cookie') || ''
            }
          })
          
          if (syncResponse.ok) {
            const { user: syncedUser } = await syncResponse.json()
            dbUserId = syncedUser.id
          }
          // If sync fails, treat as anonymous
        }
      } catch (error) {
        console.error('Error checking/syncing user:', error)
        // Continue as anonymous if error
      }
    }
    
    // For anonymous users (or failed sync), create or get anonymous record
    if (!dbUserId) {
      // Get or create anonymous identifier from cookies
      const cookieStore = await cookies()
      let identifier = cookieStore.get('anonymous-id')?.value
      
      if (!identifier) {
        // Generate new identifier and set cookie
        identifier = 'anon_' + nanoid(10)
        cookieStore.set('anonymous-id', identifier, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365 // 1 year
        })
      }
      
      console.log('Anonymous save identifier:', identifier)
      
      // Check if anonymous user exists or create new one
      const anonymousSearch = await prisma.anonymousSearch.upsert({
        where: { identifier },
        update: {
          searchCount: { increment: 1 },
          lastSearchAt: new Date(),
        },
        create: {
          identifier,
          searchCount: 1,
          lastSearchAt: new Date(),
        }
      })
      
      anonymousId = anonymousSearch.id
    }
    
    // Create search history record
    const searchHistory = await prisma.searchHistory.create({
      data: {
        location,
        query: query || null,
        resultsJson: {
          agencies: results || [],
          placeId,
          coordinates,
          searchedAt: new Date().toISOString()
        },
        userId: dbUserId || null,
        anonymousId: anonymousId
      }
    })
    
    return NextResponse.json({
      searchId: searchHistory.id,
      success: true
    })
    
  } catch (error) {
    console.error('Error saving search to database:', error)
    
    // Provide detailed error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Database operation failed',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
  }
}