/**
 * Constants and configuration for Supabase
 */

// Redirect URLs for authentication
export const REDIRECT_URL = 
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    : 'http://localhost:3000'

// Auth callback URL
export const AUTH_CALLBACK_URL = `${REDIRECT_URL}/api/auth/callback`

// Default site URL for redirects
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/api/auth/callback',
  '/api/auth/test-login',
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/test',
  '/auth/test-login',
  '/_next',
  '/favicon.ico',
  '/public',
  '/assets'
]

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  "/",
  "/messages",
  "/bookmarks",
  "/profile",
  "/explore",
  "/communities",
  "/jobs",
  "/premium",
  "/more",
  "/compose",
  "/BetterMe",
  "/ar",
  "/reels", 
  "/notifications",
  "/groups"
]

// Routes for development only
export const DEV_ONLY_ROUTES = [
  "/debug",
  "/test-users",
  "/test-avatars",
  "/test-bighead",
  "/test-combined"
]

// API routes that don't require authentication
export const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/webhooks'
]