/**
 * Authentication utilities for API routes
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get the authenticated user from an API route
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const supabase = createClient(req)
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return { user: null, session: null, dbUser: null, error: error || new Error('Unauthorized') }
  }
  
  // Get the user from the database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  return { user: session.user, session, dbUser, error: null }
}

/**
 * Middleware function to protect API routes
 * Usage:
 * export const POST = withAuth(async (req, { user, dbUser }) => {
 *   // Your API route logic here
 * })
 */
export function withAuth<T>(
  handler: (
    req: NextRequest,
    authData: Awaited<ReturnType<typeof getAuthenticatedUser>>
  ) => Promise<T>
) {
  return async (req: NextRequest) => {
    const authData = await getAuthenticatedUser(req)
    
    if (!authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return handler(req, authData)
  }
}

/**
 * Update the user's profile in the database
 */
export async function updateUserProfile(userId: string, data: any) {
  return prisma.user.update({
    where: { id: userId },
    data
  })
}