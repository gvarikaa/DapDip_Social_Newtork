/**
 * Authentication utilities for Supabase
 * This provides a compatibility layer for existing code that might have used a different auth system
 */

import { getSupabaseServer } from './server'
import { getSupabaseBrowser } from './client'
import { User } from '@supabase/supabase-js'
import { PrismaClient, User as PrismaUser } from '@prisma/client'
import { cache } from 'react'

const prisma = new PrismaClient()

/**
 * Server-side authentication function
 * This provides compatibility with legacy code that might have used a different auth system
 */
export async function auth() {
  try {
    const { user, session, error } = await getServerComponentUser()
    
    if (error || !user) {
      return { userId: null, user: null, dbUser: null, session: null }
    }
    
    // Get the database user record
    const dbUser = await getUserBySupabaseId(user.id)
    
    return {
      userId: user.id,
      user,
      dbUser,
      session,
    }
  } catch (error) {
    console.error('Auth error:', error)
    return { userId: null, user: null, dbUser: null, session: null }
  }
}

/**
 * Client-side authentication check
 * Use this in client components to check if user is authenticated
 */
export async function checkAuthClient() {
  try {
    const supabase = getSupabaseBrowser()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return { user: null, session: null }
    }
    
    return {
      user: session.user,
      session,
    }
  } catch (error) {
    console.error('Client auth check error:', error)
    return { user: null, session: null }
  }
}

/**
 * Get the current user from server components (cached)
 */
export const getServerComponentUser = cache(async () => {
  const supabase = await getSupabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return { user: null, session: null, error: error || new Error('No session found') }
  }
  
  return { user: session.user, session, error: null }
})

/**
 * Check if a user has an active session
 */
export async function hasActiveSession() {
  try {
    const { user } = await getServerComponentUser()
    return !!user
  } catch (error) {
    return false
  }
}

/**
 * Get user from the database by Supabase ID
 */
export async function getUserBySupabaseId(supabaseId: string): Promise<PrismaUser | null> {
  try {
    return await prisma.user.findUnique({
      where: { id: supabaseId },
    })
  } catch (error) {
    console.error('Error fetching user by Supabase ID:', error)
    return null
  }
}

/**
 * Create a user in the database if they don't exist
 * This is typically called from a webhook handler when a user signs up
 */
export async function createOrUpdateUser(supabaseUser: User) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    })
    
    if (existingUser) {
      // Update existing user
      return await prisma.user.update({
        where: { id: supabaseUser.id },
        data: {
          email: supabaseUser.email,
          emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null,
          // Add other fields as needed
        },
      })
    } else {
      // Create new user
      return await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null,
          // Set defaults for required fields
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          // Add other fields as needed
        },
      })
    }
  } catch (error) {
    console.error('Error creating or updating user:', error)
    throw error
  }
}

/**
 * Delete a user from the database
 * This is typically called from a webhook handler when a user is deleted
 */
export async function deleteUser(supabaseId: string) {
  try {
    await prisma.user.delete({
      where: { id: supabaseId },
    })
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}