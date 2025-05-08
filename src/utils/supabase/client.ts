/**
 * Client-side Supabase client for browser environments
 * This should only be used in client components marked with "use client"
 */

import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // These env vars need to be accessible to the browser
  // They should be prefixed with NEXT_PUBLIC_ in your .env file
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export a singleton instance for client components
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}

/**
 * Example usage in client components:
 * 
 * "use client"
 * import { getSupabaseBrowser } from '@/utils/supabase/client'
 * 
 * export default function ClientComponent() {
 *   const handleSignIn = async () => {
 *     const supabase = getSupabaseBrowser()
 *     const { error } = await supabase.auth.signInWithPassword({...})
 *   }
 * }
 */