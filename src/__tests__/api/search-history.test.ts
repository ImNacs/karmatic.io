import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/search/history/route'
import { DELETE } from '@/app/api/search/history/[id]/route'
import { POST as RESTORE } from '@/app/api/search/history/[id]/restore/route'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    anonymousSearch: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    searchHistory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Search History API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/search/history', () => {
    it('should return search history for authenticated user', async () => {
      const mockUserId = 'user_123'
      const mockUser = { id: 'db_user_123', clerkUserId: mockUserId }
      const mockSearches = [
        {
          id: 'search_1',
          location: 'San Francisco',
          query: 'agencies',
          createdAt: new Date('2024-01-01'),
        },
      ]

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.searchHistory.findMany as jest.Mock).mockResolvedValue(mockSearches)

      const request = new NextRequest('http://localhost:3000/api/search/history')
      const response = await GET(request)
      const data = await response.json()

      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          location: true,
          query: true,
          createdAt: true,
        },
      })

      expect(data.searches).toBeDefined()
      expect(data.total).toBe(1)
    })

    it('should return search history for anonymous user with cookie', async () => {
      const mockIdentifier = 'anon_abc123'
      const mockAnonymous = { id: 'anon_db_123', identifier: mockIdentifier }
      const mockSearches = [
        {
          id: 'search_2',
          location: 'New York',
          query: null,
          createdAt: new Date('2024-01-02'),
        },
      ]

      ;(auth as jest.Mock).mockResolvedValue({ userId: null })
      ;(cookies as jest.Mock).mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: mockIdentifier }),
      })
      ;(prisma.anonymousSearch.findUnique as jest.Mock).mockResolvedValue(mockAnonymous)
      ;(prisma.searchHistory.findMany as jest.Mock).mockResolvedValue(mockSearches)

      const request = new NextRequest('http://localhost:3000/api/search/history')
      const response = await GET(request)
      const data = await response.json()

      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith({
        where: {
          anonymousId: mockAnonymous.id,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          location: true,
          query: true,
          createdAt: true,
        },
      })

      expect(data.searches).toBeDefined()
      expect(data.total).toBe(1)
    })

    it('should return empty history for anonymous user without cookie', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: null })
      ;(cookies as jest.Mock).mockResolvedValue({
        get: jest.fn().mockReturnValue(null),
      })

      const request = new NextRequest('http://localhost:3000/api/search/history')
      const response = await GET(request)
      const data = await response.json()

      expect(data.searches).toEqual([])
      expect(data.total).toBe(0)
    })
  })

  describe('DELETE /api/search/history/[id]', () => {
    it('should soft delete search for authorized user', async () => {
      const mockUserId = 'user_123'
      const mockUser = { id: 'db_user_123', clerkUserId: mockUserId }
      const mockSearch = {
        id: 'search_1',
        userId: mockUser.id,
        user: mockUser,
        anonymous: null,
      }

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(prisma.searchHistory.findUnique as jest.Mock).mockResolvedValue(mockSearch)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.searchHistory.update as jest.Mock).mockResolvedValue({
        ...mockSearch,
        deletedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/search/history/search_1')
      const response = await DELETE(request, { params: { id: 'search_1' } })
      const data = await response.json()

      expect(prisma.searchHistory.update).toHaveBeenCalledWith({
        where: { id: 'search_1' },
        data: { deletedAt: expect.any(Date) },
      })

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 403 for unauthorized user', async () => {
      const mockUserId = 'user_123'
      const mockUser = { id: 'db_user_123', clerkUserId: mockUserId }
      const otherUser = { id: 'db_user_456' }
      const mockSearch = {
        id: 'search_1',
        userId: otherUser.id,
        user: otherUser,
        anonymous: null,
      }

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(prisma.searchHistory.findUnique as jest.Mock).mockResolvedValue(mockSearch)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/search/history/search_1')
      const response = await DELETE(request, { params: { id: 'search_1' } })

      expect(response.status).toBe(403)
      expect(prisma.searchHistory.update).not.toHaveBeenCalled()
    })

    it('should soft delete for anonymous user with correct cookie', async () => {
      const mockIdentifier = 'anon_abc123'
      const mockAnonymous = { id: 'anon_db_123', identifier: mockIdentifier }
      const mockSearch = {
        id: 'search_2',
        anonymousId: mockAnonymous.id,
        anonymous: mockAnonymous,
        user: null,
      }

      ;(auth as jest.Mock).mockResolvedValue({ userId: null })
      ;(cookies as jest.Mock).mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: mockIdentifier }),
      })
      ;(prisma.searchHistory.findUnique as jest.Mock).mockResolvedValue(mockSearch)
      ;(prisma.searchHistory.update as jest.Mock).mockResolvedValue({
        ...mockSearch,
        deletedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/search/history/search_2')
      const response = await DELETE(request, { params: { id: 'search_2' } })

      expect(response.status).toBe(200)
      expect(prisma.searchHistory.update).toHaveBeenCalled()
    })
  })

  describe('POST /api/search/history/[id]/restore', () => {
    it('should restore soft-deleted search', async () => {
      const mockUserId = 'user_123'
      const mockUser = { id: 'db_user_123', clerkUserId: mockUserId }
      const mockSearch = {
        id: 'search_1',
        userId: mockUser.id,
        user: mockUser,
        anonymous: null,
        deletedAt: new Date('2024-01-01'),
      }

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(prisma.searchHistory.findUnique as jest.Mock).mockResolvedValue(mockSearch)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.searchHistory.update as jest.Mock).mockResolvedValue({
        ...mockSearch,
        deletedAt: null,
      })

      const request = new NextRequest('http://localhost:3000/api/search/history/search_1/restore')
      const response = await RESTORE(request, { params: { id: 'search_1' } })
      const data = await response.json()

      expect(prisma.searchHistory.update).toHaveBeenCalledWith({
        where: { id: 'search_1' },
        data: { deletedAt: null },
      })

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 if search is not deleted', async () => {
      const mockUserId = 'user_123'
      const mockUser = { id: 'db_user_123', clerkUserId: mockUserId }
      const mockSearch = {
        id: 'search_1',
        userId: mockUser.id,
        user: mockUser,
        anonymous: null,
        deletedAt: null,
      }

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(prisma.searchHistory.findUnique as jest.Mock).mockResolvedValue(mockSearch)

      const request = new NextRequest('http://localhost:3000/api/search/history/search_1/restore')
      const response = await RESTORE(request, { params: { id: 'search_1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search is not deleted')
      expect(prisma.searchHistory.update).not.toHaveBeenCalled()
    })
  })
})