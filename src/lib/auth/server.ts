/**
 * Server-side authentication utilities
 */

import { getSupabaseServer } from '@/utils/supabase/server'
import { ExtendedAuthResult } from './types'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import { cache } from 'react'

const prisma = new PrismaClient()

/**
 * Get the current authenticated user on the server
 * This is cached to avoid multiple requests to Supabase
 */
export const getServerUser = cache(async (): Promise<ExtendedAuthResult> => {
  try {
    const supabase = await getSupabaseServer()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return { 
        user: null, 
        session: null, 
        dbUser: null, 
        userId: null, 
        error: error || new Error('No session found') 
      }
    }
    
    // Get the user record from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    return { 
      user: session.user, 
      session, 
      dbUser, 
      userId: session.user.id, 
      error: null 
    }
  } catch (error) {
    console.error('Error getting server user:', error)
    return { 
      user: null, 
      session: null, 
      dbUser: null, 
      userId: null, 
      error: error instanceof Error ? error : new Error('Failed to get server user') 
    }
  }
})

/**
 * Check if the current user is authenticated
 * If not, redirect to the sign-in page
 */
export async function requireAuth(redirectTo = '/auth/signin') {
  const { user } = await getServerUser()
  
  if (!user) {
    redirect(redirectTo)
  }
  
  return user
}

/**
 * Helper to check if a user is signed in without redirection
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getServerUser()
  return !!user
}

/**
 * Sign out the current user on the server
 */
export async function serverSignOut() {
  const supabase = await getSupabaseServer()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete('supabase-auth-token')
}