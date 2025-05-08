/**
 * Server-side Supabase client for Next.js server components and API routes
 * This should only be used in server environments
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This will fail in middleware since cookies can't be set in middleware responses
            // We'll handle these through the middleware-specific client
          }
        },
        remove(name: string, options: { path: string; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // Same middleware limitation as above
          }
        },
      },
    }
  )
}

/**
 * Helper function to get the current authenticated user in server components
 */
export async function getServerComponentUser() {
  const supabase = await getSupabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return { 
      user: null,
      session: null,
      error: error || new Error('No session found')
    }
  }
  
  return { 
    user: session.user,
    session,
    error: null
  }
}

/**
 * Example usage in Server Components:
 * 
 * import { getServerComponentUser } from '@/utils/supabase/server'
 * 
 * export default async function ServerComponent() {
 *   const { user, error } = await getServerComponentUser()
 *   
 *   if (!user) return <p>Please sign in</p>
 *   
 *   return <p>Hello, {user.email}</p>
 * }
 */