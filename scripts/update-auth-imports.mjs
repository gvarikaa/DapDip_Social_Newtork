#!/usr/bin/env node

/**
 * This script updates Clerk auth imports to Supabase auth imports
 * in all API route files in the src/app/api directory.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');

// Recursive function to find all .ts files in a directory
async function findTsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      return findTsFiles(fullPath);
    } else if (entry.name.endsWith('.ts')) {
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
    
    // Replace Clerk auth imports with Supabase auth imports
    const updatedContent = content
      .replace(
        /import\s+{\s*auth\s*}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
        "import { auth } from \"@/utils/supabase/auth\";"
      )
      .replace(
        /import\s+{\s*auth\s*,\s*(.*?)\s*}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
        "import { auth } from \"@/utils/supabase/auth\";\nimport { $1 } from \"@clerk/nextjs/server\";"
      );
    
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
    // Find all .ts files in the API directory
    const files = await findTsFiles(apiDir);
    console.log(`Found ${files.length} .ts files in the API directory.`);
    
    // Update imports in all files
    let updatedCount = 0;
    for (const file of files) {
      const updated = await updateImports(file);
      if (updated) updatedCount++;
    }
    
    console.log(`Updated auth imports in ${updatedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();