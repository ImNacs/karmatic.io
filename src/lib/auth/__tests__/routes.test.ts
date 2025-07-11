import { describe, expect, test } from 'vitest';
import { isProtectedRoute, isPublicRoute, getPostAuthRedirect } from '../routes.config';

describe('Route Protection', () => {
  describe('isProtectedRoute', () => {
    test('identifies protected routes correctly', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true);
      expect(isProtectedRoute('/dashboard/history')).toBe(true);
      expect(isProtectedRoute('/settings')).toBe(true);
      expect(isProtectedRoute('/admin/users')).toBe(true);
      expect(isProtectedRoute('/s/abc123/analysis')).toBe(true);
    });
    
    test('identifies public routes correctly', () => {
      expect(isProtectedRoute('/')).toBe(false);
      expect(isProtectedRoute('/search')).toBe(false);
      expect(isProtectedRoute('/pricing')).toBe(false);
      expect(isProtectedRoute('/auth/signin')).toBe(false);
    });
  });
  
  describe('isPublicRoute', () => {
    test('identifies public routes correctly', () => {
      expect(isPublicRoute('/')).toBe(true);
      expect(isPublicRoute('/search')).toBe(true);
      expect(isPublicRoute('/pricing')).toBe(true);
      expect(isPublicRoute('/about')).toBe(true);
    });
    
    test('identifies non-public routes correctly', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
      expect(isPublicRoute('/admin')).toBe(false);
      expect(isPublicRoute('/s/abc123')).toBe(false);
    });
  });
  
  describe('getPostAuthRedirect', () => {
    test('returns requested URL for valid internal URLs', () => {
      expect(getPostAuthRedirect('/dashboard/history')).toBe('/dashboard/history');
      expect(getPostAuthRedirect('/s/abc123')).toBe('/s/abc123');
    });
    
    test('returns default URL for auth routes', () => {
      expect(getPostAuthRedirect('/auth/signin')).toBe('/dashboard');
      expect(getPostAuthRedirect('/sign-up')).toBe('/dashboard');
    });
    
    test('returns default URL for external URLs', () => {
      expect(getPostAuthRedirect('https://external.com')).toBe('/dashboard');
    });
    
    test('uses custom default URL when provided', () => {
      expect(getPostAuthRedirect(null, '/home')).toBe('/home');
      expect(getPostAuthRedirect('/auth/signin', '/home')).toBe('/home');
    });
  });
});