'use client'

/**
 * Auth context provider for client components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSupabaseBrowser } from '@/utils/supabase/client'
import { AuthContextType, AuthResult, OAuthProvider, SignUpOptions } from './types'
import { User as PrismaUser } from '@prisma/client'

// Default context value
const defaultContextValue: AuthContextType = {
  user: null,
  dbUser: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => ({ user: null, session: null, error: new Error('Not implemented') }),
  signInWithMagicLink: async () => ({ user: null, session: null, error: new Error('Not implemented') }),
  signInWithOAuth: async () => ({ user: null, session: null, error: new Error('Not implemented') }),
  signUp: async () => ({ user: null, session: null, error: new Error('Not implemented') }),
  signOut: async () => {},
  refreshUser: async () => {}
}

// Create the auth context
const AuthContext = createContext<AuthContextType>(defaultContextValue)

// Hook for using auth context
export const useAuth = () => useContext(AuthContext)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [dbUser, setDbUser] = useState<PrismaUser | null>(null)
  const [session, setSession] = useState<AuthContextType['session']>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Initialize the auth state
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    
    // Set the initial session
    const initializeAuth = async () => {
      try {
        setLoading(true)
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        if (session) {
          // Set the current user
          setUser(session.user)
          setSession(session)
          
          // Fetch the database user
          await fetchDbUser(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setError(error instanceof Error ? error : new Error('Failed to initialize authentication'))
      } finally {
        setLoading(false)
      }
    }
    
    // Run the initialization
    initializeAuth()
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          setSession(session)
          await fetchDbUser(session.user.id)
        } else {
          setUser(null)
          setSession(null)
          setDbUser(null)
        }
        
        setLoading(false)
      }
    )
    
    // Clean up subscription on unmount
    return () => {
      subscription?.unsubscribe()
    }
  }, [])
  
  // Fetch the database user
  const fetchDbUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setDbUser(data)
      } else {
        setDbUser(null)
      }
    } catch (error) {
      console.error('Error fetching database user:', error)
      setDbUser(null)
    }
  }
  
  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }
  
  // Sign in with magic link
  const signInWithMagicLink = async (email: string, redirectTo?: string): Promise<AuthResult> => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }
  
  // Sign in with OAuth
  const signInWithOAuth = async (provider: OAuthProvider, redirectTo?: string): Promise<AuthResult> => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }
  
  // Sign up with email and password
  const signUp = async (email: string, password: string, options?: SignUpOptions): Promise<AuthResult> => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowser()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: options?.redirectTo,
          data: options?.data
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
    } finally {
      setLoading(false)
    }
  }
  
  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowser()
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing out:', error)
      setError(error instanceof Error ? error : new Error('Failed to sign out'))
    } finally {
      setLoading(false)
    }
  }
  
  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!user) return
    
    try {
      setLoading(true)
      await fetchDbUser(user.id)
    } catch (error) {
      console.error('Error refreshing user:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Authentication provider value
  const value: AuthContextType = {
    user,
    dbUser,
    session,
    loading,
    error,
    signIn,
    signInWithMagicLink,
    signInWithOAuth,
    signUp,
    signOut,
    refreshUser
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}