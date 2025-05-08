/**
 * OAuth callback handler for Supabase authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SITE_URL } from '@/utils/supabase/constants'

/**
 * Handle OAuth callback from Supabase
 * This endpoint receives the callback from Supabase after an OAuth login
 * and sets the session cookie
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    
    if (!code) {
      // If there's no code, redirect to the sign-in page
      return NextResponse.redirect(`${SITE_URL}/auth/signin?error=missing_code`)
    }
    
    const cookieStore = request.cookies
    const supabase = createClient(request)
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error.message)
      return NextResponse.redirect(
        `${SITE_URL}/auth/signin?error=${encodeURIComponent(error.message)}`
      )
    }
    
    // Successful authentication, redirect to the requested page or home
    const redirectUrl = next && next.startsWith('/') 
      ? `${SITE_URL}${next}`
      : SITE_URL
      
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      `${SITE_URL}/auth/signin?error=unexpected_error`
    )
  }
}