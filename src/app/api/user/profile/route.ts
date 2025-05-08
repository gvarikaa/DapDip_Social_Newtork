/**
 * User profile API route
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, updateUserProfile } from '@/lib/auth/api-route'

/**
 * Get the current user's profile
 */
export const GET = withAuth(async (req, { user, dbUser }) => {
  if (!dbUser) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(dbUser)
})

/**
 * Update the current user's profile
 */
export const PATCH = withAuth(async (req, { user, dbUser }) => {
  if (!dbUser) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 404 }
    )
  }
  
  try {
    const data = await req.json()
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'bio', 'avatar', 'social']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }
    
    const updatedUser = await updateUserProfile(user.id, updateData)
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})