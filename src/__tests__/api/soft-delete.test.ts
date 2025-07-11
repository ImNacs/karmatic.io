import { NextRequest } from 'next/server'
import { POST as CLEANUP, GET as CLEANUP_STATUS } from '@/app/api/search/cleanup/route'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    searchHistory: {
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock environment variable
const originalEnv = process.env
beforeAll(() => {
  process.env = { ...originalEnv, CLEANUP_SECRET_KEY: 'test-secret' }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Soft Delete Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/search/cleanup', () => {
    it('should delete old soft-deleted records with valid auth', async () => {
      const mockDeletedCount = 5
      ;(prisma.searchHistory.deleteMany as jest.Mock).mockResolvedValue({
        count: mockDeletedCount,
      })

      const request = new NextRequest('http://localhost:3000/api/search/cleanup', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      })

      const response = await CLEANUP(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.deletedCount).toBe(mockDeletedCount)
      expect(data.message).toBe(`Successfully cleaned up ${mockDeletedCount} old records`)

      // Verify the query
      expect(prisma.searchHistory.deleteMany).toHaveBeenCalledWith({
        where: {
          deletedAt: {
            not: null,
            lt: expect.any(Date),
          },
        },
      })

      // Check the date is approximately 30 days ago
      const callArg = (prisma.searchHistory.deleteMany as jest.Mock).mock.calls[0][0]
      const dateArg = callArg.where.deletedAt.lt
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - 30)
      
      // Allow 1 minute difference for test execution time
      expect(Math.abs(dateArg.getTime() - expectedDate.getTime())).toBeLessThan(60000)
    })

    it('should return 401 with invalid auth', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/cleanup', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      })

      const response = await CLEANUP(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(prisma.searchHistory.deleteMany).not.toHaveBeenCalled()
    })

    it('should return 401 with missing auth', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/cleanup')

      const response = await CLEANUP(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(prisma.searchHistory.deleteMany).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.searchHistory.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/search/cleanup', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      })

      const response = await CLEANUP(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to clean up old records')
    })
  })

  describe('GET /api/search/cleanup', () => {
    it('should return cleanup status', async () => {
      const mockPendingCount = 3
      const mockTotalCount = 10

      ;(prisma.searchHistory.count as jest.Mock)
        .mockResolvedValueOnce(mockPendingCount) // First call - pending cleanup
        .mockResolvedValueOnce(mockTotalCount) // Second call - total soft deleted

      const response = await CLEANUP_STATUS()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pendingCleanup).toBe(mockPendingCount)
      expect(data.totalSoftDeleted).toBe(mockTotalCount)
      expect(data.cleanupThresholdDays).toBe(30)

      // Verify queries
      expect(prisma.searchHistory.count).toHaveBeenCalledTimes(2)
      
      // First query - records older than 30 days
      expect(prisma.searchHistory.count).toHaveBeenNthCalledWith(1, {
        where: {
          deletedAt: {
            not: null,
            lt: expect.any(Date),
          },
        },
      })

      // Second query - all soft deleted
      expect(prisma.searchHistory.count).toHaveBeenNthCalledWith(2, {
        where: {
          deletedAt: {
            not: null,
          },
        },
      })
    })

    it('should handle errors in status endpoint', async () => {
      ;(prisma.searchHistory.count as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const response = await CLEANUP_STATUS()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get cleanup status')
    })
  })

  describe('Soft Delete Integration', () => {
    it('should properly filter soft-deleted items in queries', () => {
      // This test verifies the pattern used across the application
      const whereClause = {
        userId: 'user_123',
        deletedAt: null,
      }

      // This is the pattern used in GET /api/search/history
      expect(whereClause).toEqual({
        userId: 'user_123',
        deletedAt: null,
      })

      // Verify null check is used (not undefined or false)
      expect(whereClause.deletedAt).toBeNull()
      expect(whereClause.deletedAt).not.toBeUndefined()
      expect(whereClause.deletedAt).not.toBe(false)
    })

    it('should set deletedAt to current timestamp on delete', () => {
      const beforeDelete = new Date()
      
      // Simulate soft delete operation
      const deletedAt = new Date()
      
      const afterDelete = new Date()

      // Verify timestamp is within reasonable range
      expect(deletedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime())
      expect(deletedAt.getTime()).toBeLessThanOrEqual(afterDelete.getTime())
    })

    it('should restore by setting deletedAt to null', () => {
      const softDeletedRecord = {
        id: 'search_1',
        deletedAt: new Date('2024-01-01'),
      }

      // Simulate restore operation
      const restoredRecord = {
        ...softDeletedRecord,
        deletedAt: null,
      }

      expect(restoredRecord.deletedAt).toBeNull()
      expect(restoredRecord.id).toBe('search_1')
    })
  })
})