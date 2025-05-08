'use server';

/**
 * დროებითი სერვერის მხარის ავთენტიფიკაცია მოდულარული მიგრაციისთვის
 */

// დროებითი ინტერფეისი, რომელიც ნაცვლდება Supabase-ის რეალური ტიპებით
interface User {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}

interface Session {
  user: User;
  expires_at: number;
}

interface AuthResult {
  userId: string | null;
  user: User | null;
  dbUser: any | null;
  session: Session | null;
}

/**
 * სერვერის auth ფუნქცია
 * 
 * აბრუნებს მომხმარებლის ინფორმაციას { userId }
 */
export async function auth() {
  // იყენებს Supabase-ის ავთენტიფიკაციას
  const { auth } = await import('@/utils/supabase/auth');
  const result = await auth();
  
  return {
    userId: result.userId,
    sessionId: result.session?.access_token || 'temp-session',
    orgId: null,
    getToken: async () => result.session?.access_token || 'mock-token',
  };
}

/**
 * სრული მონაცემები მომხმარებლის შესახებ
 * აბრუნებს მომხმარებლის სრულ ინფორმაციას
 */
export async function currentUser() {
  // იყენებს Supabase-ის ავთენტიფიკაციას
  const { auth } = await import('@/utils/supabase/auth');
  const result = await auth();
  
  if (!result.user) {
    return null;
  }
  
  return {
    id: result.userId || 'temp-user-id',
    username: result.user.user_metadata?.username || result.dbUser?.username || result.user.email?.split('@')[0] || 'temp-user',
    email: result.user.email || 'temp@example.com',
    firstName: result.user.user_metadata?.first_name || result.dbUser?.firstName || 'Temp',
    lastName: result.user.user_metadata?.last_name || result.dbUser?.lastName || 'User',
    imageUrl: result.user.user_metadata?.avatar_url || result.dbUser?.img || 'https://ui-avatars.com/api/?name=TU',
    emailAddresses: [{ emailAddress: result.user.email || 'temp@example.com' }],
  };
}

/**
 * API მარშრუტებისთვის მომხმარებლის ავთენტიფიკაციის შემოწმება
 */
export async function withAuth<T>(
  handler: (params: { userId: string; user: User }) => Promise<T>
): Promise<T> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  const user = {
    id: userId,
    email: 'temp@example.com',
    user_metadata: { name: 'Temp User' }
  };
  
  return handler({ userId, user });
}

/**
 * კომპლექსური მომხმარებლის მონაცემები
 * მიგრაციის შემდეგ ეს უნდა შეიცვალოს რეალური Supabase-დან მონაცემების მიღებით
 */
export async function getAuthUser(): Promise<AuthResult> {
  // იყენებს Supabase-ის ავთენტიფიკაციას
  const { auth } = await import('@/utils/supabase/auth');
  return await auth();
}