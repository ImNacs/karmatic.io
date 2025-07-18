/**
 * @fileoverview API endpoint for search history
 * @module app/api/search-history
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId
      }
    })

    if (!user) {
      return NextResponse.json({ searches: [] })
    }

    // Get recent searches from conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
        messages: {
          where: {
            messageIndex: 0,
            role: 'user'
          },
          select: {
            content: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Transform conversations to search format
    const searches = conversations.map(conv => {
      const metadata = conv.metadata as any
      const userMessage = conv.messages[0]?.content || ''
      
      // Extract query and location from message or metadata
      const match = userMessage.match(/Busco (.+) en (.+)/) || userMessage.match(/Busco opciones en (.+)/)
      const query = match && match[1] !== 'opciones' ? match[1] : (metadata.query || '')
      const location = match ? (match[2] || match[1]) : (metadata.location || '')
      
      return {
        id: conv.id,
        query: query,
        location: location,
        createdAt: conv.createdAt,
        resultCount: metadata.resultCount || 0
      }
    })

    return NextResponse.json({ searches })
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json({ searches: [] })
  }
}