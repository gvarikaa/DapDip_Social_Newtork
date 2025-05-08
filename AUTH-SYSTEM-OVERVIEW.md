# Authentication System Overview

This document provides an overview of the Supabase authentication system implemented in this application.

## Architecture

The authentication system uses Supabase Auth with a custom integration layer to provide a seamless experience throughout the application. The system is built with Next.js App Router and uses a combination of client and server components.

## Key Components

### 1. Supabase Client

- **Browser Client** (`/src/utils/supabase/client.ts`): Used in client components
- **Server Client** (`/src/utils/supabase/server.ts`): Used in server components and API routes
- **Middleware Client** (`/src/utils/supabase/middleware.ts`): Used for route protection

### 2. Authentication Context

- **Auth Context** (`/src/lib/auth/context.tsx`): Provides auth state to client components
- **Auth Hooks**: `useAuth()` hook for accessing auth state in client components

### 3. Server-Side Utilities

- **Server Functions** (`/src/lib/auth/server.ts`): Functions for server components
- **Auth Helpers** (`/src/utils/supabase/auth.ts`): User management utilities

### 4. Authentication Pages

- **Sign In** (`/src/app/auth/signin/page.tsx`): Email/password and OAuth sign-in
- **Sign Up** (`/src/app/auth/signup/page.tsx`): New user registration
- **Password Reset** (`/src/app/auth/reset-password/page.tsx`): Password recovery

### 5. API Routes

- **OAuth Callback** (`/src/app/api/auth/callback/route.ts`): Handles OAuth redirects
- **Logout** (`/src/app/api/auth/logout/route.ts`): Server-side logout
- **Webhooks** (`/src/app/api/webhooks/supabase/route.ts`): User lifecycle management

## Authentication Flow

### 1. Sign-Up Flow

1. User visits the sign-up page
2. User enters email, password, and other required information
3. Form submission triggers `signUp()` function from auth context
4. Supabase creates a new user and sends confirmation email
5. User confirms email by clicking the link
6. Webhook receives user.created event
7. User record is created in the application database

### 2. Sign-In Flow

1. User visits the sign-in page
2. User enters email and password
3. Form submission triggers `signIn()` function from auth context
4. Supabase authenticates and returns a session
5. Auth context stores the session and retrieves user data
6. User is redirected to the requested page

### 3. OAuth Flow

1. User clicks on OAuth provider button (Google, GitHub, etc.)
2. User is redirected to the provider's authentication page
3. After authentication, provider redirects back to the callback URL
4. Callback endpoint exchanges code for session
5. User is redirected to the application with an active session

### 4. Route Protection

1. Middleware intercepts all requests
2. For protected routes, middleware checks for an active session
3. If no session, user is redirected to the sign-in page
4. If session exists, request proceeds normally

### 5. User Session Management

1. Auth context subscribes to auth state changes
2. When session changes, context updates the user state
3. All components using the `useAuth()` hook receive updated state
4. Session is persisted in cookies for server-side rendering

## Database Integration

The authentication system integrates with the application database via:

1. **Webhooks**: Create/update/delete user records when auth events occur
2. **User Fetch**: Retrieve additional user data from the database when needed
3. **Profile Updates**: Sync profile changes between Supabase and the database

## Security Considerations

1. **Token Storage**: JWT tokens stored in cookies with HttpOnly flag
2. **Session Expiry**: Configurable session duration
3. **CSRF Protection**: Built-in protection via Supabase
4. **Webhook Verification**: Signature verification for webhook events

## Configuration

The authentication system is configured via environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_WEBHOOK_SECRET=your-webhook-secret
```

## Extending the System

### Adding Authentication Providers

1. Configure the provider in the Supabase dashboard
2. Update sign-in/sign-up pages to include the new provider
3. Update user creation logic if needed

### Custom User Data

1. Update the user creation webhook to include additional fields
2. Modify the database schema if necessary
3. Update the auth context to expose the new fields

### Custom Authentication Logic

1. Extend the auth context with new functions
2. Update server-side utilities as needed
3. Create new API routes for custom flows