#!/usr/bin/env node

/**
 * This script updates the Clerk sign-in/sign-up routes to redirect to Supabase auth routes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function createRedirectPage(fileName, targetPath) {
  const redirectCode = `
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("${targetPath}");
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting to ${targetPath}...</p>
    </div>
  );
}
`;

  await fs.writeFile(fileName, redirectCode, 'utf8');
  console.log(`Created redirect page: ${path.relative(rootDir, fileName)}`);
}

async function main() {
  try {
    // Create sign-in redirect
    const signInDir = path.join(rootDir, 'src', 'app', 'sign-in', '[[...sign-in]]');
    await fs.mkdir(signInDir, { recursive: true });
    await createRedirectPage(
      path.join(signInDir, 'page.tsx'),
      '/auth/signin'
    );
    
    // Create sign-up redirect
    const signUpDir = path.join(rootDir, 'src', 'app', 'sign-up', '[[...sign-up]]');
    await fs.mkdir(signUpDir, { recursive: true });
    await createRedirectPage(
      path.join(signUpDir, 'page.tsx'),
      '/auth/signup'
    );
    
    console.log('Auth route redirects created successfully!');
  } catch (error) {
    console.error('Error updating auth routes:', error);
    process.exit(1);
  }
}

main();