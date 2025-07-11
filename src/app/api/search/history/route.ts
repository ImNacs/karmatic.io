import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    let searchHistory = []
    
    if (userId) {
      // Get authenticated user's search history
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId }
      })
      
      if (user) {
        searchHistory = await prisma.searchHistory.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 searches
          select: {
            id: true,
            location: true,
            query: true,
            createdAt: true
          }
        })
      }
    } else {
      // Get anonymous user's search history based on cookie
      const cookieStore = await cookies()
      const identifier = cookieStore.get('anonymous-id')?.value
      
      console.log('Anonymous history identifier:', identifier)
      
      if (!identifier) {
        // No anonymous identifier, return empty history
        return NextResponse.json({
          searches: [],
          total: 0
        })
      }
      
      const anonymousSearch = await prisma.anonymousSearch.findUnique({
        where: { identifier }
      })
      
      if (anonymousSearch) {
        searchHistory = await prisma.searchHistory.findMany({
          where: { anonymousId: anonymousSearch.id },
          orderBy: { createdAt: 'desc' },
          take: 20, // Less for anonymous users
          select: {
            id: true,
            location: true,
            query: true,
            createdAt: true
          }
        })
      }
    }
    
    // Group by date
    const grouped = groupSearchesByDate(searchHistory)
    
    return NextResponse.json({
      searches: grouped,
      total: searchHistory.length
    })
    
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    )
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