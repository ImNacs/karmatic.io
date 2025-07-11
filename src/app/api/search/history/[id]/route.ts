import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    
    // First, find the search history item
    const searchHistory = await prisma.searchHistory.findUnique({
      where: { id },
      include: {
        user: true,
        anonymous: true
      }
    })
    
    if (!searchHistory) {
      return NextResponse.json(
        { error: 'Search history not found' },
        { status: 404 }
      )
    }
    
    // Check permissions
    if (userId) {
      // Authenticated user - check if they own this search
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId }
      })
      
      if (!user || searchHistory.userId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    } else {
      // Anonymous user - check cookie identifier
      const cookieStore = await cookies()
      const identifier = cookieStore.get('anonymous-id')?.value
      
      if (!identifier || searchHistory.anonymous?.identifier !== identifier) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }
    
    // Soft delete the search history item
    await prisma.searchHistory.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
    
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