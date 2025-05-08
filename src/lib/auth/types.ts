/**
 * Types for the authentication system
 */

import { User, Session } from '@supabase/supabase-js'
import { User as PrismaUser } from '@prisma/client'

/**
 * Basic authentication result
 */
export interface AuthResult {
  user: User | null
  session: Session | null
  error: Error | null
}

/**
 * Extended authentication result that includes the database user
 */
export interface ExtendedAuthResult extends AuthResult {
  dbUser: PrismaUser | null
  userId: string | null
}

/**
 * Authentication context value
 */
export interface AuthContextType {
  user: User | null
  dbUser: PrismaUser | null
  session: Session | null
  loading: boolean
  error: Error | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<AuthResult>
  signInWithOAuth: (provider: OAuthProvider, redirectTo?: string) => Promise<AuthResult>
  signUp: (email: string, password: string, options?: SignUpOptions) => Promise<AuthResult>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

/**
 * OAuth providers supported by Supabase
 */
export type OAuthProvider = 
  | 'google'
  | 'github'
  | 'apple'
  | 'facebook'
  | 'twitter'
  | 'discord'
  | 'spotify'
  | 'twitch'
  | 'slack'
  | 'gitlab'

/**
 * Options for signing up
 */
export interface SignUpOptions {
  redirectTo?: string
  data?: {
    name?: string
    [key: string]: any
  }
}