# Testing the Supabase Authentication System

This guide provides steps to test the Supabase authentication implementation in this application.

## Prerequisites

1. **Environment Setup**
   - Ensure all required environment variables are set
   - Make sure the application is running in development mode (`npm run dev`)

2. **Test User Credentials**
   - Have a test user email and password ready
   - Or prepare to create a new test user

## 1. Testing Sign-Up

### Web UI Testing

1. Navigate to `/auth/signup`
2. Fill in the form with test user details:
   - Name: Test User
   - Email: testuser@example.com
   - Password: testpassword123
   - Confirm Password: testpassword123
3. Submit the form
4. You should see the confirmation email notification
5. Check the Supabase dashboard → Authentication → Users to confirm the user was created

### API Testing

```bash
curl -X POST 'http://localhost:3000/api/auth/signup' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "testuser-api@example.com",
    "password": "testpassword123",
    "name": "API Test User"
  }'
```

Expected response: Success message with details about confirmation email

## 2. Testing Sign-In

### Web UI Testing

1. Navigate to `/auth/signin`
2. Enter the test user credentials:
   - Email: testuser@example.com
   - Password: testpassword123
3. Submit the form
4. You should be redirected to the home page or the specified redirect URL
5. Check that authentication state is preserved (you remain logged in)

### API Testing

```bash
curl -X POST 'http://localhost:3000/api/auth/signin' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "testuser@example.com",
    "password": "testpassword123"
  }'
```

Expected response: Success message with session token

## 3. Testing Protected Routes

1. Sign out (if signed in)
2. Try to access a protected route (e.g., `/profile`, `/messages`)
3. You should be redirected to the sign-in page
4. Sign in with valid credentials
5. Try to access the protected route again
6. You should now be able to access the route

## 4. Testing Sign-Out

### Web UI Testing

1. Ensure you are signed in
2. Click on the sign-out button (usually in the user menu or profile section)
3. You should be redirected to the sign-in page
4. Try to access a protected route
5. You should be redirected to the sign-in page (confirming you are signed out)

### API Testing

```bash
curl -X POST 'http://localhost:3000/api/auth/logout'
```

Expected response: Success message confirming logout

## 5. Testing OAuth Authentication

### Web UI Testing

1. Navigate to the sign-in page
2. Click on "Sign in with Google" or other OAuth provider
3. Complete the OAuth flow in the provider's popup
4. You should be redirected back to the application and be signed in
5. Check the Supabase dashboard to confirm the user was created with OAuth

## 6. Testing Password Reset

### Web UI Testing

1. Navigate to `/auth/signin`
2. Click on "Forgot password?"
3. Enter your email address
4. Submit the form
5. Check for the reset password email
6. Follow the link in the email
7. Set a new password
8. Try to sign in with the new password

## 7. Testing User Profile Integration

1. Sign in with a test user
2. Access a page that displays user profile information (e.g., `/profile`)
3. Verify that the correct user information is displayed
4. Make changes to the profile if possible
5. Sign out and sign back in
6. Verify that the changes were saved

## 8. Testing Webhook Integration

This requires manual setup in the Supabase dashboard:

1. Go to Supabase Authentication → Webhooks
2. Create a test event (e.g., user.created)
3. Check your application logs to ensure the webhook was received and processed
4. Verify that the user was created in your database

## Common Issues and Troubleshooting

### Session Not Persisting

- Check browser cookies (should see Supabase auth cookies)
- Verify that the Supabase client is properly initialized
- Ensure the middleware is correctly configured

### OAuth Redirect Errors

- Check that callback URLs are properly configured in Supabase
- Ensure that the OAuth provider is properly set up
- Look for error messages in the browser console or server logs

### User Not Found in Database

- Check webhook configurations
- Verify webhook handler logic for creating users
- Ensure database connection is working

## Debugging Tools

1. **Supabase Dashboard**
   - Authentication → Users: Check user accounts
   - Authentication → Logs: View authentication events

2. **Browser Tools**
   - Chrome DevTools → Application → Cookies: Check auth cookies
   - Network tab: Inspect auth API calls

3. **Server Logs**
   - Check your application logs for errors
   - Look for webhook processing logs