import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    let conversations = []
    
    if (userId) {
      // Get authenticated user's search history
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId }
      })
      
      if (user) {
        conversations = await prisma.conversation.findMany({
          where: { 
            userId: user.id,
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            metadata: true,
            createdAt: true
          }
        })
      }
    } else {
      // Para usuarios no autenticados, no mostrar historial
      console.log('🔍 No userId, returning empty history')
    }
    
    // Transform conversations to search history format
    const searchHistory = conversations.map(conv => {
      const metadata = conv.metadata as any || {}
      
      // Extract location and query from metadata or title
      let location = metadata.location || ''
      let query = metadata.query || ''
      
      // If no location in metadata, try to extract from title
      if (!location && conv.title) {
        const match = conv.title.match(/(.+) en (.+)/)
        if (match) {
          query = match[1]
          location = match[2]
        } else {
          location = conv.title
        }
      }
      
      return {
        id: conv.id,
        location: location || 'Sin ubicación',
        query: query || null,
        createdAt: conv.createdAt
      }
    })
    
    // Group by date
    const grouped = groupSearchesByDate(searchHistory)
    
    
    return NextResponse.json({
      searches: grouped,
      total: searchHistory.length
    })
    
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json({
      searches: [],
      total: 0
    })
  }
}

function groupSearchesByDate(searches: any[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastMonth = new Date(today)
  lastMonth.setDate(lastMonth.getDate() - 30)
  
  const groups: Record<string, any[]> = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: []
  }
  
  searches.forEach(search => {
    const searchDate = new Date(search.createdAt)
    
    if (searchDate >= today) {
      groups.today.push(search)
    } else if (searchDate >= yesterday) {
      groups.yesterday.push(search)
    } else if (searchDate >= lastWeek) {
      groups.lastWeek.push(search)
    } else if (searchDate >= lastMonth) {
      groups.lastMonth.push(search)
    } else {
      groups.older.push(search)
    }
  })
  
  // Filter out empty groups and format labels
  const result = []
  if (groups.today.length > 0) {
    result.push({ label: 'Hoy', searches: groups.today })
  }
  if (groups.yesterday.length > 0) {
    result.push({ label: 'Ayer', searches: groups.yesterday })
  }
  if (groups.lastWeek.length > 0) {
    result.push({ label: 'Última semana', searches: groups.lastWeek })
  }
  if (groups.lastMonth.length > 0) {
    result.push({ label: 'Último mes', searches: groups.lastMonth })
  }
  if (groups.older.length > 0) {
    result.push({ label: 'Más antiguo', searches: groups.older })
  }
  
  return result
}