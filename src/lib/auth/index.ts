export * from './routes.config';
export * from './route-guards';
export * from './session';

// Re-export commonly used functions
export { requireAuth, redirectIfAuthenticated } from './route-guards';
export { getSession, storeRedirectPath, getAndClearRedirectPath } from './session';
export { 
  AUTH_ROUTES, 
  PROTECTED_ROUTES, 
  PUBLIC_ROUTES,
  isProtectedRoute,
  isPublicRoute,
  getPostAuthRedirect
} from './routes.config';