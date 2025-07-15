import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getOrCreateSearchSession } from '@/lib/search-tracking'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const sessionId = await getOrCreateSearchSession()
    
    // Get user ID from Clerk if authenticated
    let dbUserId = null
    if (userId) {
      const { data: user } = await supabase
        .from('User')
        .select('id')
        .eq('clerkUserId', userId)
        .single()
      
      dbUserId = user?.id
    }
    
    // Call the SQL function to get search history
    const { data: searches, error } = await supabase.rpc('get_search_history', {
      p_user_id: dbUserId,
      p_session_id: !dbUserId ? sessionId : null,
      p_include_deleted: false
    })
    
    if (error) {
      console.error('Error fetching search history:', error)
      throw error
    }
    
    // Transform data to match existing UI format
    const transformedSearches = (searches || []).map((search: any) => ({
      id: search.id,
      location: search.location || '',
      query: search.query || null,
      createdAt: search.created_at
    }))
    
    // Group by date using existing function
    const grouped = groupSearchesByDate(transformedSearches)
    
    return NextResponse.json({
      searches: grouped,
      total: transformedSearches.length
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