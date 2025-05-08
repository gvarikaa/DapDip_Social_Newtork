/**
 * Server component helpers for authentication
 */

import { getServerUser } from './server'
import { redirect } from 'next/navigation'

/**
 * Protect a page or component to only be accessible when authenticated
 */
export async function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user } = await getServerUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return <>{children}</>
}

/**
 * Page or component only accessible when not authenticated
 */
export async function PublicOnlyPage({ children }: { children: React.ReactNode }) {
  const { user } = await getServerUser()
  
  if (user) {
    redirect('/')
  }
  
  return <>{children}</>
}

/**
 * Component that conditionally renders content based on authentication state
 */
export async function AuthAwareComponent({
  authenticated,
  unauthenticated
}: {
  authenticated: React.ReactNode
  unauthenticated: React.ReactNode
}) {
  const { user } = await getServerUser()
  
  return <>{user ? authenticated : unauthenticated}</>
}

/**
 * Get the current user for use in server components
 */
export async function CurrentUser({ children }: { 
  children: (user: Awaited<ReturnType<typeof getServerUser>>) => React.ReactNode 
}) {
  const userData = await getServerUser()
  
  return <>{children(userData)}</>
}