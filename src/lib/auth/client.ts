'use client'

/**
 * Client-side authentication utilities
 */

import { getSupabaseBrowser } from '@/utils/supabase/client'
import { AuthResult, OAuthProvider } from './types'

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseBrowser()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw error
    }
    
    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error('Failed to sign in')
    }
  }
}

/**
 * Sign in with one-time password (magic link)
 */
export async function signInWithOtp(email: string, redirectTo?: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseBrowser()
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    
    if (error) {
      throw error
    }
    
    return { user: null, session: null, error: null }
  } catch (error) {
    console.error('Error sending magic link:', error)
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error('Failed to send magic link')
    }
  }
}

/**
 * Sign in with an OAuth provider
 */
export async function signInWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseBrowser()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    })
    
    if (error) {
      throw error
    }
    
    return { user: null, session: null, error: null }
  } catch (error) {
    console.error(`Error signing in with ${provider}:`, error)
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error(`Failed to sign in with ${provider}`)
    }
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string, 
  password: string, 
  redirectTo?: string,
  metadata?: Record<string, any>
): Promise<AuthResult> {
  try {
    const supabase = getSupabaseBrowser()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: metadata
      }
    })
    
    if (error) {
      throw error
    }
    
    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error('Failed to sign up')
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Reset password with email
 */
export async function resetPassword(email: string, redirectTo?: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseBrowser()
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })
    
    if (error) {
      throw error
    }
    
    return { user: null, session: null, error: null }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error('Failed to reset password')
    }
  }
}