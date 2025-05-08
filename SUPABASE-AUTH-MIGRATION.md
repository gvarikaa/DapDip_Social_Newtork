# Supabase Auth Migration Guide

This guide provides step-by-step instructions for completing the migration from Clerk to Supabase authentication.

## Prerequisites

1. **Supabase Project**
   - Create a Supabase project if you haven't already
   - Get your project URL and API keys from the Supabase dashboard

2. **Environment Variables**
   - Set the following variables in your `.env` file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     SUPABASE_WEBHOOK_SECRET=your-webhook-secret
     ```

## Step 1: Configure Supabase Project

1. **Enable Authentication Methods**
   - Go to Authentication > Providers
   - Enable Email/Password sign-in
   - Configure OAuth providers if needed (Google, GitHub, etc.)

2. **Set Up Email Templates**
   - Go to Authentication > Email Templates
   - Customize confirmation and reset password templates

3. **Configure Webhooks**
   - Go to Authentication > Webhooks
   - Create webhooks for auth events (user.created, user.updated, user.deleted)
   - Point them to your `/api/webhooks/supabase` endpoint
   - Set the webhook secret and add it to your environment variables

## Step 2: Update Remaining Client Components

Find components that use Clerk's `useUser` or `useClerk` hooks and update them to use the Supabase auth context:

1. **Find Components**
   ```bash
   grep -r "useUser\|useClerk\|SignIn\|SignUp\|SignOut" --include="*.tsx" src/components/
   ```

2. **Update Each Component**
   - Replace Clerk imports with Supabase auth context:
     ```typescript
     // From:
     import { useUser } from "@clerk/nextjs";
     
     // To:
     import { useAuth } from "@/lib/auth";
     ```
   
   - Update usage:
     ```typescript
     // From:
     const { user } = useUser();
     
     // To:
     const { user, dbUser } = useAuth();
     ```

3. **Handle Data Structure Differences**
   - Clerk: `user.username`, `user.imageUrl`
   - Supabase: `dbUser.username`, `dbUser.img`

## Step 3: Update Server-Side Auth Usage

1. **Import Server Utilities**
   ```typescript
   import { getServerUser, requireAuth } from "@/lib/auth/server";
   ```

2. **Use in Server Components**
   ```typescript
   // To get the current user:
   const { user, dbUser } = await getServerUser();
   
   // To require authentication (redirects if not authenticated):
   const user = await requireAuth();
   ```

## Step 4: Update API Routes

1. **Import Server Client**
   ```typescript
   import { createClient } from "@/utils/supabase/server";
   ```

2. **Use in API Routes**
   ```typescript
   export async function GET(request: Request) {
     const supabase = createClient(request);
     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session) {
       return Response.json({ error: "Unauthorized" }, { status: 401 });
     }
     
     // Continue with authenticated request
   }
   ```

## Step 5: Test Authentication Flows

1. **Sign-up Flow**
   - Navigate to `/auth/signup`
   - Create a new account
   - Confirm email if required

2. **Sign-in Flow**
   - Navigate to `/auth/signin`
   - Sign in with existing credentials

3. **Protected Routes**
   - Attempt to access protected routes while signed out (should redirect)
   - Access protected routes while signed in (should work)

4. **OAuth Authentication**
   - Test sign-in with Google or GitHub
   - Ensure redirect back to the application works

## Step 6: Cleanup Clerk Dependencies

1. **Remove Package**
   ```bash
   npm uninstall @clerk/nextjs
   ```

2. **Remove Environment Variables**
   - Remove all `CLERK_*` environment variables from `.env` files

3. **Remove Clerk Public Routes**
   - Remove Clerk's public route configuration

## Troubleshooting

### Session Not Persisting

- Check that cookies are being properly set and read
- Ensure Supabase client is properly configured

### OAuth Redirect Issues

- Verify the redirect URL is set correctly in Supabase dashboard
- Check that the callback URL matches your API route

### Database User Not Created

- Check webhook configuration
- Verify the user creation logic in your webhook handler

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase OAuth Configuration](https://supabase.com/docs/guides/auth/social-login)