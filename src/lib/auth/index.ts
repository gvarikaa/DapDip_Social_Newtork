'use client';

/**
 * Auth exports for the application
 * This file re-exports things from the auth context
 */

export { useAuth, AuthProvider } from './context';
export type { AuthContextType, AuthResult, OAuthProvider, SignUpOptions } from './types';