#!/usr/bin/env node

/**
 * This script updates multiple page files to use Supabase auth instead of Clerk auth
 */

import fs from 'fs/promises';
import path from 'path';

const filesToUpdate = [
  '/home/nugo/x/src/app/messages/[conversationId]/page.tsx',
  '/home/nugo/x/src/app/messages/new/page.tsx',
  '/home/nugo/x/src/app/messages/page.tsx',
  '/home/nugo/x/src/app/(board)/[username]/status/[postId]/page.tsx',
  '/home/nugo/x/src/app/(board)/[username]/page.tsx'
];

async function updateFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    const updatedContent = content.replace(
      /import { auth } from "@clerk\/nextjs\/server";/g,
      'import { auth } from "@/utils/supabase/auth";'
    );
    
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`No changes needed for: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log("Starting batch update of page components...");
  
  let updatedCount = 0;
  for (const file of filesToUpdate) {
    const updated = await updateFile(file);
    if (updated) updatedCount++;
  }
  
  console.log(`Completed updating ${updatedCount} of ${filesToUpdate.length} files.`);
}

main();