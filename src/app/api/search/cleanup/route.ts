import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint can be called by a cron job to clean up old soft-deleted records
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add additional auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Delete records that were soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const result = await prisma.searchHistory.deleteMany({
      where: {
        deletedAt: {
          not: null,
          lt: thirtyDaysAgo
        }
      }
    })
    
    console.log(`Cleaned up ${result.count} old soft-deleted records`)
    
    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully cleaned up ${result.count} old records`
    })
    
  } catch (error) {
    console.error('Error cleaning up old records:', error)
    return NextResponse.json(
      { error: 'Failed to clean up old records' },
      { status: 500 }
    )
  }
}

// GET endpoint for monitoring cleanup status
export async function GET() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Count records pending cleanup
    const pendingCleanup = await prisma.searchHistory.count({
      where: {
        deletedAt: {
          not: null,
          lt: thirtyDaysAgo
        }
      }
    })
    
    // Count total soft-deleted records
    const totalSoftDeleted = await prisma.searchHistory.count({
      where: {
        deletedAt: {
          not: null
        }
      }
    })
    
    return NextResponse.json({
      pendingCleanup,
      totalSoftDeleted,
      cleanupThresholdDays: 30
    })
    
  } catch (error) {
    console.error('Error getting cleanup status:', error)
    return NextResponse.json(
      { error: 'Failed to get cleanup status' },
      { status: 500 }
    )
  }
}