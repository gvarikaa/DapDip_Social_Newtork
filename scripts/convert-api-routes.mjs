#!/usr/bin/env node

/**
 * API მარშრუტების კონვერტაციის სკრიპტი
 * 
 * Clerk-დან Supabase-ზე მიგრაციისთვის
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob';

// სამუშაო დირექტორიის მიღება
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// API მარშრუტების საქაღალდე
const apiRoutesDir = path.join(rootDir, 'src', 'app', 'api');

// ყველა route.ts ფაილის მოძიება
async function findAllRoutes() {
  return new Promise((resolve, reject) => {
    glob('**/route.ts', { cwd: apiRoutesDir }, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files.map(file => path.join(apiRoutesDir, file)));
    });
  });
}

// ფაილში Clerk იმპორტის შემოწმება
function hasClerkImport(content) {
  return content.includes('@clerk/nextjs') || 
         content.includes('clerk') || 
         content.includes('Clerk');
}

// Clerk-ის იმპორტების ჩანაცვლება
function replaceClerkImports(content) {
  // Replace: import { auth } from "@clerk/nextjs/server";
  const newContent = content
    .replace(
      /import\s+\{\s*(auth)\s*\}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
      'import { auth } from "@/lib/auth/server-only";'
    )
    .replace(
      /import\s+\{\s*(auth),\s*(currentUser)\s*\}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
      'import { auth, getAuthUser } from "@/lib/auth/server-only";'
    )
    .replace(
      /import\s+\{\s*(auth),\s*(clerkClient)\s*\}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
      'import { auth } from "@/lib/auth/server-only";'
    )
    .replace(
      /import\s+\{\s*(currentUser)\s*\}\s+from\s+["']@clerk\/nextjs\/server["'];?/g, 
      'import { getAuthUser } from "@/lib/auth/server-only";'
    );
  
  return newContent;
}

// await auth() → auth() შეცვლა
function replaceAwaitAuth(content) {
  return content.replace(
    /const\s+\{\s*([^}]+)\s*\}\s+=\s+await\s+auth\(\);/g,
    'const { $1 } = auth();'
  );
}

// currentUser → getAuthUser შეცვლა
function replaceCurrentUser(content) {
  return content.replace(
    /const\s+user\s+=\s+await\s+currentUser\(\);/g,
    'const { user } = await getAuthUser();'
  );
}

// ფაილის კონვერტაცია
async function convertFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // შემოწმება თუ ფაილში Clerk არის გამოყენებული
    if (!hasClerkImport(originalContent)) {
      console.log(`✓ ${filePath} - არ საჭიროებს ცვლილებას`);
      return false;
    }
    
    // კონვერტაციები
    let newContent = replaceClerkImports(originalContent);
    newContent = replaceAwaitAuth(newContent);
    newContent = replaceCurrentUser(newContent);
    
    // შევინახოთ შეცვლილი ფაილი
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${filePath} - წარმატებით განახლდა`);
    return true;
  } catch (error) {
    console.error(`❌ შეცდომა ${filePath} ფაილის განახლებისას:`, error);
    return false;
  }
}

// მთავარი ფუნქცია
async function main() {
  try {
    console.log('🔍 ვეძებთ API მარშრუტებს...');
    const routeFiles = await findAllRoutes();
    console.log(`🔎 ნაპოვნია ${routeFiles.length} მარშრუტი`);
    
    let convertedCount = 0;
    
    for (const file of routeFiles) {
      const converted = await convertFile(file);
      if (converted) convertedCount++;
    }
    
    console.log(`\n✨ დასრულდა! ${convertedCount}/${routeFiles.length} ფაილი განახლდა`);
  } catch (error) {
    console.error('❌ შეცდომა კონვერტაციისას:', error);
    process.exit(1);
  }
}

// სკრიპტის გაშვება
main();