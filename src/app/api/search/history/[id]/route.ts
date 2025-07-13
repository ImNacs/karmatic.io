import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getOrCreateSearchSession } from '@/lib/search-tracking'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
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
    
    // Call the SQL function to soft delete
    const { data: success, error } = await supabase.rpc('delete_search_history', {
      p_conversation_id: id, // id is the conversationId in the new system
      p_user_id: dbUserId,
      p_session_id: !dbUserId ? sessionId : null
    })
    
    if (error) {
      console.error('Error deleting search history:', error)
      
      if (error.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Search history not found' },
          { status: 404 }
        )
      }
      
      throw error
    }
    
    if (!success) {
      return NextResponse.json(
        { error: 'Unauthorized or not found' },
        { status: 403 }
      )
    }
    
    console.log('Soft deleted search history:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Search history deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting search history:', error)
    return NextResponse.json(
      { error: 'Failed to delete search history' },
      { status: 500 }
    )
  }
}