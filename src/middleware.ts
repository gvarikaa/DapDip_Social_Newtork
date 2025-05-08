import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'
import { PUBLIC_ROUTES, PROTECTED_ROUTES, PUBLIC_API_ROUTES } from '@/utils/supabase/constants'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes, static files, etc.
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next()
  }
  
  // Create Supabase client for middleware
  const supabase = createClient(request)
  
  // Check authentication status
  const { data: { session } } = await supabase.auth.getSession()
  
  // If accessing a protected route but not authenticated, redirect to sign in
  if (
    PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`)) && 
    !session
  ) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}