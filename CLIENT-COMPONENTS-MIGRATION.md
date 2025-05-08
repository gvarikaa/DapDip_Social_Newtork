# კლიენტის კომპონენტების მიგრაცია Clerk-დან Supabase-ზე

ეს დოკუმენტი გაგატარებთ კლიენტის კომპონენტების მიგრაციის პროცესს Clerk-დან Supabase-ზე. მიგრაციის დროს უნდა განაახლოთ ყველა კომპონენტი, რომელიც იყენებს Clerk-ის ავთენტიფიკაციას.

## 1. ძირითადი ცვლილებები

| Clerk | Supabase |
|-------|----------|
| `import { useUser } from "@clerk/nextjs";` | `import { useAuth } from "@/lib/auth";` |
| `const { user, isLoaded } = useUser();` | `const { user, loading } = useAuth();` |
| `if (!isLoaded) return <Loading />;` | `if (loading) return <Loading />;` |
| `user.id` | `user.id` |
| `user.firstName, user.lastName` | `user.user_metadata?.name` or `dbUser.name` |
| `user.emailAddresses[0].emailAddress` | `user.email` |
| `user.imageUrl` | `user.user_metadata?.avatar_url` or `dbUser.img` |

## 2. მაგალითები

### 2.1 მარტივი მაგალითი

#### Clerk ვერსია:

```tsx
import { useUser } from "@clerk/nextjs";

function ProfileButton() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <button>Sign In</button>;
  
  return <button>{user.firstName || user.username}</button>;
}
```

#### Supabase ვერსია:

```tsx
import { useAuth } from "@/lib/auth";

function ProfileButton() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <button>Sign In</button>;
  
  return <button>{user.user_metadata?.name || user.email?.split('@')[0]}</button>;
}
```

### 2.2 რთული მაგალითი

#### Clerk ვერსია:

```tsx
import { useUser } from "@clerk/nextjs";

function PostLikeButton({ postId }: { postId: number }) {
  const { user, isLoaded } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    // ამოწმებს, მოწონებულია თუ არა პოსტი
    checkIfLiked(postId, user.id);
  }, [user, postId]);
  
  const handleLike = async () => {
    if (!user) return;
    
    await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: user.id })
    });
    
    setIsLiked(prev => !prev);
  };
  
  if (!isLoaded) return <div>Loading...</div>;
  
  return (
    <button onClick={handleLike}>
      {isLiked ? 'Unlike' : 'Like'}
    </button>
  );
}
```

#### Supabase ვერსია:

```tsx
import { useAuth } from "@/lib/auth";

function PostLikeButton({ postId }: { postId: number }) {
  const { user, loading } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    // ამოწმებს, მოწონებულია თუ არა პოსტი
    checkIfLiked(postId, user.id);
  }, [user, postId]);
  
  const handleLike = async () => {
    if (!user) return;
    
    await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: user.id })
    });
    
    setIsLiked(prev => !prev);
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <button onClick={handleLike}>
      {isLiked ? 'Unlike' : 'Like'}
    </button>
  );
}
```

### 2.3 SignIn/SignUp კომპონენტები

#### Clerk ვერსია:

```tsx
import { SignIn } from "@clerk/nextjs";

function SignInPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <SignIn />
    </div>
  );
}
```

#### Supabase ვერსია:

```tsx
'use client';

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  };
  
  return (
    <div>
      <h1>Sign In</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
```

## 3. უხშირესი კომპონენტების მიგრაცია

### 3.1 ნავიგაციის კომპონენტი

#### Clerk ვერსია:

```tsx
import { UserButton, useUser } from "@clerk/nextjs";

function Navbar() {
  const { user, isLoaded } = useUser();
  
  return (
    <nav>
      <a href="/">Home</a>
      {isLoaded && user ? (
        <>
          <a href="/dashboard">Dashboard</a>
          <UserButton />
        </>
      ) : (
        <a href="/sign-in">Sign In</a>
      )}
    </nav>
  );
}
```

#### Supabase ვერსია:

```tsx
import { useAuth } from "@/lib/auth";

function Navbar() {
  const { user, loading, signOut } = useAuth();
  
  return (
    <nav>
      <a href="/">Home</a>
      {!loading && user ? (
        <>
          <a href="/dashboard">Dashboard</a>
          <div className="relative">
            <button className="flex items-center">
              <img
                src={user.user_metadata?.avatar_url || "/default-avatar.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            </button>
            <div className="absolute right-0 mt-2 bg-white shadow-md rounded-md p-2">
              <a href="/profile">Profile</a>
              <button onClick={() => signOut()}>Sign Out</button>
            </div>
          </div>
        </>
      ) : (
        <a href="/auth/signin">Sign In</a>
      )}
    </nav>
  );
}
```

### 3.2 მომხმარებლის პროფილი

#### Clerk ვერსია:

```tsx
import { useUser } from "@clerk/nextjs";

function ProfilePage() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return (
    <div>
      <h1>Profile</h1>
      <img src={user.imageUrl} alt="Profile" />
      <p>Name: {user.firstName} {user.lastName}</p>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

#### Supabase ვერსია:

```tsx
import { useAuth } from "@/lib/auth";

function ProfilePage() {
  const { user, dbUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return (
    <div>
      <h1>Profile</h1>
      <img src={dbUser?.img || user.user_metadata?.avatar_url || "/default-avatar.png"} alt="Profile" />
      <p>Name: {dbUser?.displayName || user.user_metadata?.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## 4. ავტომატური მიგრაცია სკრიპტით

თქვენ შეგიძლიათ გამოიყენოთ შემდეგი სკრიპტი ფაილებში Clerk-ის იმპორტების ავტომატურად შესაცვლელად.

შექმენით ფაილი `scripts/convert-client-components.mjs`:

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob';

// სამუშაო დირექტორიის მიღება
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// კომპონენტების დირექტორია
const componentsDir = path.join(rootDir, 'src', 'components');
const appDir = path.join(rootDir, 'src', 'app');

// ყველა .tsx ფაილის მოძიება
async function findAllComponents() {
  return new Promise((resolve, reject) => {
    glob('**/*.tsx', { cwd: rootDir, ignore: ['node_modules/**', '.next/**'] }, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files.map(file => path.join(rootDir, file)));
    });
  });
}

// ფაილში Clerk იმპორტის შემოწმება
function hasClerkImport(content) {
  return content.includes('@clerk/nextjs') || 
         content.includes('useUser') || 
         content.includes('UserButton') ||
         content.includes('SignIn') ||
         content.includes('SignUp');
}

// Clerk-ის იმპორტების ჩანაცვლება
function replaceClerkImports(content) {
  // იმპორტების ჩანაცვლება
  let newContent = content
    .replace(
      /import\s+\{\s*useUser\s*\}\s+from\s+["']@clerk\/nextjs["'];?/g, 
      'import { useAuth } from "@/lib/auth";'
    )
    .replace(
      /import\s+\{\s*useUser,\s*(.*)\s*\}\s+from\s+["']@clerk\/nextjs["'];?/g, 
      'import { useAuth } from "@/lib/auth";\nimport { $1 } from "@/components/auth";'
    )
    .replace(
      /import\s+\{\s*(.*),\s*useUser\s*\}\s+from\s+["']@clerk\/nextjs["'];?/g, 
      'import { useAuth } from "@/lib/auth";\nimport { $1 } from "@/components/auth";'
    );
  
  // useUser ჰუკის ჩანაცვლება
  newContent = newContent
    .replace(
      /const\s+\{\s*user,\s*isLoaded\s*\}\s+=\s+useUser\(\);/g,
      'const { user, loading } = useAuth();'
    )
    .replace(
      /const\s+\{\s*isLoaded,\s*user\s*\}\s+=\s+useUser\(\);/g,
      'const { user, loading } = useAuth();'
    )
    .replace(
      /const\s+\{\s*user\s*\}\s+=\s+useUser\(\);/g,
      'const { user } = useAuth();'
    );
  
  // isLoaded → loading ჩანაცვლება
  newContent = newContent
    .replace(/if\s*\(\s*!isLoaded\s*\)/g, 'if (loading)')
    .replace(/isLoaded\s*\?/g, '!loading ?')
    .replace(/!isLoaded\s*\?/g, 'loading ?');
  
  // user.property ჩანაცვლება
  newContent = newContent
    .replace(/user\.firstName/g, 'user.user_metadata?.name?.split(" ")[0]')
    .replace(/user\.lastName/g, 'user.user_metadata?.name?.split(" ")[1]')
    .replace(/user\.username/g, 'user.email?.split("@")[0]')
    .replace(/user\.imageUrl/g, 'user.user_metadata?.avatar_url || dbUser?.img')
    .replace(/user\.emailAddresses\[0\]\.emailAddress/g, 'user.email');
  
  return newContent;
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
    
    // კონვერტაცია
    const newContent = replaceClerkImports(originalContent);
    
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
    console.log('🔍 ვეძებთ კომპონენტებს...');
    const componentFiles = await findAllComponents();
    console.log(`🔎 ნაპოვნია ${componentFiles.length} კომპონენტი`);
    
    let convertedCount = 0;
    
    for (const file of componentFiles) {
      const converted = await convertFile(file);
      if (converted) convertedCount++;
    }
    
    console.log(`\n✨ დასრულდა! ${convertedCount}/${componentFiles.length} ფაილი განახლდა`);
  } catch (error) {
    console.error('❌ შეცდომა კონვერტაციისას:', error);
    process.exit(1);
  }
}

// სკრიპტის გაშვება
main();
```

განახლებული ფაილების გასაშვებად:

```bash
node scripts/convert-client-components.mjs
```

## 5. შემდგომი ნაბიჯები

1. განაახლეთ ყველა კომპონენტი მიგრაციის სკრიპტით
2. ხელით შეამოწმეთ კომპლექსური კომპონენტები
3. შექმენით ახალი SignIn/SignUp კომპონენტები
4. დარწმუნდით, რომ UserButton-ის ჩანაცვლება გაქვთ
5. განაახლეთ წვდომის კონტროლის კომპონენტები (მაგ., `<SignedIn>`)

## 6. რჩევები წარმატებული მიგრაციისთვის

1. **ეტაპობრივად განახლეთ:** დაიწყეთ მარტივი კომპონენტებით, მერე გადადით რთულზე
2. **ტესტირება:** კომპონენტების ყოველი ჯგუფის განახლების შემდეგ გატესტეთ
3. **დაამატეთ კონსოლის ლოგები:** გამართვის დროს დაამატეთ `console.log(user)` და შეამოწმეთ მომხმარებლის ობიექტის სტრუქტურა
4. **ერთიანი მიდგომა:** გამოიყენეთ ერთიანი მიდგომა მომხმარებლის მონაცემების მიღებისთვის (მაგ., მომხმარებლის სახელისთვის)

## 7. ტესტირება

კომპონენტების განახლების შემდეგ, რეკომენდებულია შემდეგი გვერდების შემოწმება:

1. **მთავარი ნავიგაცია:** დარწმუნდით, რომ ავტორიზაციის სტატუსი სწორად აისახება
2. **პროფილის გვერდი:** შეამოწმეთ პირადი ინფორმაციის ჩვენება
3. **ავთენტიფიკაციის გვერდები:** სცადეთ შესვლა/გამოსვლა
4. **დაცული გვერდები:** შეამოწმეთ წვდომის კონტროლი
5. **/debug/auth-migration** გვერდი: შეამოწმეთ კლიენტისა და სერვერის ავთენტიფიკაციის სტატუსი