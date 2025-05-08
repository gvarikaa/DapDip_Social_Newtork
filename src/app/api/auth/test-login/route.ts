/**
 * Test login endpoint for development environments
 * This should only be accessible in development mode
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Development-only route to automatically login a test user
 */
export async function GET(request: NextRequest) {
  // Only available in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(
      JSON.stringify({ error: 'This endpoint is only available in development' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    const supabase = createClient(request)
    
    // Sign in with a development test account
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com'
    const testPassword = process.env.TEST_USER_PASSWORD || 'test-password-123'
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    if (error) {
      console.error('Error signing in test user:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Unexpected error in test login:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Create a test user if it doesn't exist
 */
export async function POST(request: NextRequest) {
  // Only available in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(
      JSON.stringify({ error: 'This endpoint is only available in development' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    const supabase = createClient(request)
    
    // Create a test user
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com'
    const testPassword = process.env.TEST_USER_PASSWORD || 'test-password-123'
    
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    if (existingUser?.user) {
      return NextResponse.json({ message: 'Test user already exists', user: existingUser.user })
    }
    
    // Create the user if they don't exist
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
        },
      },
    })
    
    if (error) {
      console.error('Error creating test user:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Create user record in the database if needed
    const dbUser = await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: testEmail,
        emailVerified: new Date(),
      },
      create: {
        id: data.user.id,
        email: testEmail,
        name: 'Test User',
        emailVerified: new Date(),
      },
    })
    
    return NextResponse.json({ 
      message: 'Test user created successfully',
      user: data.user,
      dbUser 
    })
  } catch (error) {
    console.error('Unexpected error creating test user:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}