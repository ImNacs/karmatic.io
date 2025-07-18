/**
 * @fileoverview API endpoint for search history
 * @module app/api/search-history
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/search-history
 * Returns user's search history
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ searches: [] })
    }

    // Get recent searches
    const searches = await prisma.searchHistory.findMany({
      where: {
        userId,
        deletedAt: null
      },
      select: {
        id: true,
        query: true,
        location: true,
        createdAt: true,
        resultCount: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json({ searches })
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json({ searches: [] })
  }
}