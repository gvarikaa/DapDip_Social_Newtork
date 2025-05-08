/**
 * Middleware-specific Supabase client
 * This should only be used in middleware.ts
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client for middleware with cookie handling
 */
export function createClient(request: NextRequest) {
  // Create a Supabase client configured for middleware usage
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
          // This is called in middleware, which can modify the response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path: string; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
          // This is called in middleware, which can modify the response cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  return supabase
}

/**
 * Example usage in middleware.ts:
 * 
 * import { createClient } from '@/utils/supabase/middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   const { pathname } = request.nextUrl
 *   
 *   // Create Supabase client for middleware
 *   const supabase = createClient(request)
 *   
 *   // Check authentication status
 *   const { data: { session } } = await supabase.auth.getSession()
 *   
 *   // Implement your auth logic here...
 * }
 */