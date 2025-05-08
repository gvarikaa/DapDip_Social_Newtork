# Middleware.ts მიგრაცია Clerk-დან Supabase-ზე

ეს დოკუმენტი აღწერს, როგორ უნდა მოხდეს Next.js middleware.ts ფაილის მიგრაცია Clerk-დან Supabase-ზე. Middleware-ის გამართული მუშაობა მნიშვნელოვანია აპლიკაციის ავთენტიფიკაციისთვის და მარშრუტების დაცვისთვის.

## კარგი ამბავი

ჩვენს პროექტში მიდლვეარი უკვე იყენებს Supabase-ის ავთენტიფიკაციას, რაც ნიშნავს რომ დიდი ნაწილი მიგრაციისა უკვე დასრულებულია. მიდლვეარ ფაილი უკვე იყენებს:

```typescript
import { createClient } from '@/utils/supabase/middleware';
```

და სესიის შემოწმებას:

```typescript
const { data } = await supabase.auth.getSession();
const session = data?.session;
```

## 1. მიდლვეარის სტრუქტურა

### Clerk-ის მიდლვეარი (სტანდარტული)

```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook", "/blog(.*)"],
  ignoredRoutes: ["/api/webhook"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Supabase-ის მიდლვეარი (უკვე იმპლემენტირებული)

```typescript
import { createClient } from '@/utils/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createClient(request);
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  // მარშრუტების დაცვის ლოგიკა...
}

export const config = {
  matcher: [/* ... */],
};
```

## 2. Clerk-ის წვდომის შემოწმება

ზოგიერთ API მარშრუტში შეიძლება გვქონდეს Clerk-ის getAuth() ფუნქციის გამოყენება, მაგალითად:

```typescript
import { getAuth } from "@clerk/nextjs/server";

export function middleware(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    // უარი ავთენტიფიკაციის გარეშე...
  }
}
```

ამის Supabase-ის ვერსია იქნება:

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createClient(request);
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    // უარი ავთენტიფიკაციის გარეშე...
  }
}
```

## 3. გადამისამართებები

### Clerk ვერსია

```typescript
if (isProtectedRoute(pathname) && !userId) {
  return NextResponse.redirect(new URL('/sign-in', request.url));
}
```

### Supabase ვერსია

```typescript
if (isProtectedRoute(pathname) && !session) {
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
```

## 4. მარშრუტების დაცვა

მარშრუტების დაცვის ლოგიკა უცვლელი რჩება, მხოლოდ სესიის შემოწმების მეთოდი იცვლება:

```typescript
// დაცული მარშრუტები
const protectedRoutes = [
  "/",
  "/messages",
  // სხვა მარშრუტები...
];

const isProtectedRoute = (path: string) => {
  // ლოგიკა მარშრუტის შესამოწმებლად...
};

// შემოწმება და რედირექტი
if (isProtectedRoute(pathname) && !session) {
  const redirectUrl = new URL('/auth/signin', request.url);
  redirectUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(redirectUrl);
}
```

## 5. API მარშრუტების დაცვა

API მარშრუტების დაცვისთვის ვიყენებთ მსგავს ლოგიკას:

```typescript
if (pathname.startsWith('/api/') && 
  !pathname.startsWith('/api/auth/') && 
  !pathname.startsWith('/api/webhooks/') && 
  !session) {
  return new NextResponse(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## 6. კუქიების გამოყენება

### Clerk ვერსია

```typescript
// Clerk იყენებს საკუთარ მექანიზმს კუქიებისთვის
const { userId } = getAuth(request);
```

### Supabase ვერსია

```typescript
// Supabase სესიას ინახავს კუქიებში
const supabase = createClient(request);
const { data } = await supabase.auth.getSession();
```

## 7. CSRF დაცვა

Supabase-ის auth.getSession() ავტომატურად ამოწმებს CSRF ტოკენებს აპლიკაციის უსაფრთხოებისთვის.

## 8. CORS შეზღუდვები

API მარშრუტებისთვის CORS პოლიტიკა:

```typescript
// OPTIONS მეთოდის დასაშვებად API-სთვის
if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}
```

## 9. დასკვნა

ჩვენი მიდლვეარ ფაილი უკვე იყენებს Supabase-ის ავთენტიფიკაციის ლოგიკას. ეს ნიშნავს, რომ ძირითადი მიგრაცია უკვე დასრულებულია, და მხოლოდ რამდენიმე წვრილმანი ცვლილება შეიძლება იყოს საჭირო იმ კონკრეტული ფუნქციონალისთვის, რომელსაც Clerk-ის ადგილობრივი API მოთხოვნებისთვის გამოვიყენებთ.

მომდევნო ნაბიჯები:

1. შეამოწმეთ ყველა API მარშრუტი, რომელიც იყენებს Clerk-ის auth() ფუნქციას
2. შეცვალეთ ის ჩვენი შუალედური auth() ფუნქციით @/lib/auth/server-only ფაილიდან
3. გაუშვით აპლიკაცია დეველოპერის რეჟიმში და შეამოწმეთ, რომ მარშრუტების დაცვა სწორად მუშაობს
4. შეამოწმეთ, რომ API მარშრუტები ავტორიზებულ მოთხოვნებს იღებენ და არაავტორიზებულ მოთხოვნებს უარყოფენ