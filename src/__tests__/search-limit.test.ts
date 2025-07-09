import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { getSearchLimit, incrementSearchCount, resetSearchCount } from '@/lib/search-tracking';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    anonymousSearch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Search Limit Functionality', () => {
  const mockSessionId = 'test-session-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSearchLimit', () => {
    it('should return default limit for new session', async () => {
      (prisma.anonymousSearch.findUnique as any).mockResolvedValue(null);
      
      const result = await getSearchLimit(mockSessionId);
      
      expect(result).toEqual({
        remaining: 1,
        total: 1,
        isAuthenticated: false,
      });
    });

    it('should return remaining searches for existing session', async () => {
      (prisma.anonymousSearch.findUnique as any).mockResolvedValue({
        searchCount: 1,
        lastSearchAt: new Date(),
      });
      
      const result = await getSearchLimit(mockSessionId);
      
      expect(result).toEqual({
        remaining: 0,
        total: 1,
        isAuthenticated: false,
      });
    });

    it('should reset count after 24 hours', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      
      (prisma.anonymousSearch.findUnique as any).mockResolvedValue({
        searchCount: 1,
        lastSearchAt: yesterday,
      });
      
      const result = await getSearchLimit(mockSessionId);
      
      expect(result).toEqual({
        remaining: 1,
        total: 1,
        isAuthenticated: false,
      });
    });
  });

  describe('incrementSearchCount', () => {
    it('should create new record for first search', async () => {
      (prisma.anonymousSearch.findUnique as any).mockResolvedValue(null);
      (prisma.anonymousSearch.create as any).mockResolvedValue({
        searchCount: 1,
        lastSearchAt: new Date(),
      });
      
      const result = await incrementSearchCount(mockSessionId);
      
      expect(prisma.anonymousSearch.create).toHaveBeenCalledWith({
        data: {
          identifier: mockSessionId,
          searchCount: 1,
          lastSearchAt: expect.any(Date),
        },
      });
      
      expect(result).toEqual({
        remaining: 0,
        total: 1,
        isAuthenticated: false,
      });
    });

    it('should increment existing count', async () => {
      const now = new Date();
      (prisma.anonymousSearch.findUnique as any).mockResolvedValue({
        searchCount: 0,
        lastSearchAt: now,
      });
      (prisma.anonymousSearch.update as any).mockResolvedValue({
        searchCount: 1,
        lastSearchAt: now,
      });
      
      const result = await incrementSearchCount(mockSessionId);
      
      expect(prisma.anonymousSearch.update).toHaveBeenCalledWith({
        where: { identifier: mockSessionId },
        data: {
          searchCount: 1,
          lastSearchAt: expect.any(Date),
        },
      });
      
      expect(result).toEqual({
        remaining: 0,
        total: 1,
        isAuthenticated: false,
      });
    });

    it('should throw error when limit exceeded', async () => {
      (prisma.anonymousSearch.findUnique as any).mockResolvedValue({
        searchCount: 1,
        lastSearchAt: new Date(),
      });
      
      await expect(incrementSearchCount(mockSessionId)).rejects.toThrow('Search limit exceeded');
    });
  });

  describe('resetSearchCount', () => {
    it('should reset count to 0', async () => {
      (prisma.anonymousSearch.update as any).mockResolvedValue({
        searchCount: 0,
        lastSearchAt: new Date(),
      });
      
      await resetSearchCount(mockSessionId);
      
      expect(prisma.anonymousSearch.update).toHaveBeenCalledWith({
        where: { identifier: mockSessionId },
        data: {
          searchCount: 0,
          lastSearchAt: expect.any(Date),
        },
      });
    });
  });
});