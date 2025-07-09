import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as checkLimitHandler } from '@/app/api/search/check-limit/route';
import { POST as trackSearchHandler } from '@/app/api/search/track/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock search tracking
vi.mock('@/lib/search-tracking', () => ({
  getOrCreateSearchSession: vi.fn(),
  getSearchLimit: vi.fn(),
  incrementSearchCount: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    searchHistory: {
      create: vi.fn(),
    },
  },
}));

// Mock GTM
vi.mock('@/lib/gtm/gtm', () => ({
  trackEvent: {
    searchCompleted: vi.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
import { getOrCreateSearchSession, getSearchLimit, incrementSearchCount } from '@/lib/search-tracking';

describe('Search Limit API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/search/check-limit', () => {
    it('should return unlimited searches for authenticated users', async () => {
      (auth as any).mockResolvedValue({ userId: 'user-123' });
      
      const response = await checkLimitHandler();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        remaining: Infinity,
        total: Infinity,
        isAuthenticated: true,
        canSearch: true,
      });
    });

    it('should return limited searches for anonymous users', async () => {
      (auth as any).mockResolvedValue({ userId: null });
      (getOrCreateSearchSession as any).mockResolvedValue('session-123');
      (getSearchLimit as any).mockResolvedValue({
        remaining: 1,
        total: 1,
        isAuthenticated: false,
      });
      
      const response = await checkLimitHandler();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        remaining: 1,
        total: 1,
        isAuthenticated: false,
        canSearch: true,
        sessionId: 'session-123',
      });
    });

    it('should indicate when user cannot search', async () => {
      (auth as any).mockResolvedValue({ userId: null });
      (getOrCreateSearchSession as any).mockResolvedValue('session-123');
      (getSearchLimit as any).mockResolvedValue({
        remaining: 0,
        total: 1,
        isAuthenticated: false,
      });
      
      const response = await checkLimitHandler();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.canSearch).toBe(false);
    });
  });

  describe('POST /api/search/track', () => {
    it('should track search for authenticated users', async () => {
      (auth as any).mockResolvedValue({ userId: 'user-123' });
      
      const request = new NextRequest('http://localhost/api/search/track', {
        method: 'POST',
        body: JSON.stringify({
          location: 'Mexico City',
          query: 'KIA Forte',
        }),
      });
      
      const response = await trackSearchHandler(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        remaining: Infinity,
        isAuthenticated: true,
      });
    });

    it('should increment count for anonymous users', async () => {
      (auth as any).mockResolvedValue({ userId: null });
      (getOrCreateSearchSession as any).mockResolvedValue('session-123');
      (incrementSearchCount as any).mockResolvedValue({
        remaining: 0,
        total: 1,
        isAuthenticated: false,
      });
      
      const request = new NextRequest('http://localhost/api/search/track', {
        method: 'POST',
        body: JSON.stringify({
          location: 'Mexico City',
          query: 'KIA Forte',
        }),
      });
      
      const response = await trackSearchHandler(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        remaining: 0,
        total: 1,
        isAuthenticated: false,
        sessionId: 'session-123',
      });
    });

    it('should handle errors gracefully', async () => {
      (auth as any).mockRejectedValue(new Error('Auth failed'));
      
      const request = new NextRequest('http://localhost/api/search/track', {
        method: 'POST',
        body: JSON.stringify({
          location: 'Mexico City',
        }),
      });
      
      const response = await trackSearchHandler(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to track search',
      });
    });
  });
});