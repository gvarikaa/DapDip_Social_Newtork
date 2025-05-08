#!/usr/bin/env node

/**
 * This script updates Clerk auth imports to Supabase auth imports
 * in all page components in the src/app directory.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'src', 'app');

// Recursive function to find all .tsx files in a directory
async function findTsxFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      return findTsxFiles(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      return [fullPath];
    } else {
      return [];
    }
  }));
  
  return files.flat();
}

// Update imports in a file
async function updateImports(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if file contains Clerk imports
    if (!content.includes('@clerk/nextjs')) {
      return false;
    }
    
    // Replace Clerk auth imports with Supabase auth imports
    let updatedContent = content
      .replace(
        /import\s+{\s*currentUser\s*}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
        "import { getServerUser } from \"@/lib/auth/server\";"
      )
      .replace(
        /import\s+{\s*useUser\s*}\s+from\s+["']@clerk\/nextjs["'];?/g, 
        "import { useAuth } from \"@/lib/auth\";"
      )
      .replace(
        /import\s+{\s*useAuth\s*}\s+from\s+["']@clerk\/nextjs["'];?/g, 
        "import { useAuth } from \"@/lib/auth\";"
      )
      .replace(
        /import\s+{\s*ClerkProvider\s*}\s+from\s+["']@clerk\/nextjs["'];?/g, 
        "import { AuthProvider } from \"@/lib/auth/context\";"
      );
    
    // Replace function calls
    updatedContent = updatedContent
      .replace(/const\s+user\s*=\s*await\s+currentUser\(\)/g, "const { user, dbUser } = await getServerUser()")
      .replace(/const\s+{\s*user\s*}\s*=\s*useUser\(\)/g, "const { user, dbUser } = useAuth()")
      .replace(/const\s+{\s*isLoaded,\s*user\s*}\s*=\s*useUser\(\)/g, "const { isLoaded, user, dbUser } = useAuth()");
    
    // Replace ClerkProvider with AuthProvider
    updatedContent = updatedContent
      .replace(/<ClerkProvider[^>]*>/g, "<AuthProvider>")
      .replace(/<\/ClerkProvider>/g, "</AuthProvider>");
    
    // Only write the file if changes were made
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${path.relative(rootDir, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Find all .tsx and .ts files in the app directory
    const files = await findTsxFiles(appDir);
    console.log(`Found ${files.length} .tsx and .ts files in the app directory.`);
    
    // Update imports in all files
    let updatedCount = 0;
    for (const file of files) {
      const updated = await updateImports(file);
      if (updated) updatedCount++;
    }
    
    console.log(`Updated Clerk references in ${updatedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();