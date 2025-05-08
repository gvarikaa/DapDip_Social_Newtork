/**
 * Logout endpoint for Supabase authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SITE_URL } from '@/utils/supabase/constants'

/**
 * Handle logout request
 * This endpoint signs the user out of Supabase and redirects to the sign-in page
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request)
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during logout' },
      { status: 500 }
    )
  }
}

/**
 * Handle GET request for logout
 * This provides a URL that can be navigated to for signing out
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/auth/signin'
    
    const supabase = createClient(request)
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Redirect to sign-in page or specified redirect
    const redirectUrl = redirectTo.startsWith('/') 
      ? `${SITE_URL}${redirectTo}`
      : SITE_URL
      
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.redirect(`${SITE_URL}/auth/signin?error=logout_failed`)
  }
}