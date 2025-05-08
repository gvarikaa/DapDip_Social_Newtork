# API მარშრუტების მიგრაცია Clerk-დან Supabase-ზე

ეს დოკუმენტი შეიცავს API მარშრუტების მიგრაციის მაგალითებს Clerk-დან Supabase-ზე. API მარშრუტების მიგრაცია არის ავთენტიფიკაციის მიგრაციის მნიშვნელოვანი ნაწილი.

## 1. ძირითადი იმპორტების ცვლილება

### Clerk ვერსია

```typescript
import { auth } from "@clerk/nextjs/server";
```

### Supabase ვერსია

```typescript
import { auth, withAuth } from "@/lib/auth/server-only";
```

## 2. ძირითადი API მარშრუტის მაგალითი

### Clerk ვერსია

```typescript
// src/app/api/example/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // კოდის დანარჩენი ნაწილი...
  
  return NextResponse.json({ data: "..." });
}
```

### Supabase ვერსია

```typescript
// src/app/api/example/route.ts
import { auth } from "@/lib/auth/server-only";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // კოდის დანარჩენი ნაწილი...
  
  return NextResponse.json({ data: "..." });
}
```

## 3. withAuth მექანიზმის გამოყენება

ზოგიერთ შემთხვევაში უმჯობესია withAuth ფუნქციის გამოყენება, რადგან ის უფრო დაცულია.

### Clerk ვერსია

```typescript
// src/app/api/protected/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const user = await currentUser();
  const email = user.emailAddresses[0].emailAddress;
  
  // კოდის დანარჩენი ნაწილი...
  
  return NextResponse.json({ data: { userId, email } });
}
```

### Supabase ვერსია

```typescript
// src/app/api/protected/route.ts
import { withAuth, getAuthUser } from "@/lib/auth/server-only";
import { NextResponse } from "next/server";

export async function GET() {
  return withAuth(async ({ userId, user }) => {
    const { dbUser } = await getAuthUser();
    const email = user.email || '';
    
    // კოდის დანარჩენი ნაწილი...
    
    return NextResponse.json({ data: { userId, email } });
  });
}
```

## 4. POST მარშრუტი

### Clerk ვერსია

```typescript
// src/app/api/data/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const data = await request.json();
  
  // მონაცემების დამუშავება...
  
  return NextResponse.json({ success: true });
}
```

### Supabase ვერსია

```typescript
// src/app/api/data/route.ts
import { auth } from "@/lib/auth/server-only";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const data = await request.json();
  
  // მონაცემების დამუშავება...
  
  return NextResponse.json({ success: true });
}
```

## 5. დინამიური მარშრუტის მაგალითი

### Clerk ვერსია

```typescript
// src/app/api/users/[userId]/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId: authUserId } = await auth();
  
  if (!authUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const targetUserId = params.userId;
  const user = await currentUser();
  
  // დანარჩენი კოდი...
  
  return NextResponse.json({ data: { user: { /* ... */ } } });
}
```

### Supabase ვერსია

```typescript
// src/app/api/users/[userId]/route.ts
import { withAuth, getAuthUser } from "@/lib/auth/server-only";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  return withAuth(async ({ userId, user }) => {
    const targetUserId = params.userId;
    const { dbUser } = await getAuthUser();
    
    // დანარჩენი კოდი...
    
    return NextResponse.json({ data: { user: { /* ... */ } } });
  });
}
```

## 6. ავთენტიფიკაციის დამატებითი ინფორმაციის მიღება

### Clerk ვერსია

```typescript
// src/app/api/profile/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const user = await currentUser();
  
  return NextResponse.json({
    id: userId,
    email: user.emailAddresses[0].emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  });
}
```

### Supabase ვერსია

```typescript
// src/app/api/profile/route.ts
import { withAuth, getAuthUser } from "@/lib/auth/server-only";
import { NextResponse } from "next/server";

export async function GET() {
  return withAuth(async ({ userId, user }) => {
    const { dbUser } = await getAuthUser();
    
    return NextResponse.json({
      id: userId,
      email: user.email,
      firstName: user.user_metadata?.firstName || '',
      lastName: user.user_metadata?.lastName || '',
      imageUrl: user.user_metadata?.avatar_url || '',
    });
  });
}
```

## 7. რჩევები API მარშრუტების მიგრაციისთვის

1. დაიწყეთ მარტივი მარშრუტებით, რომლებიც მხოლოდ `userId`-ს იყენებენ
2. შემდეგ მიგრაცია გაუკეთეთ კომპლექსურ მარშრუტებს, რომლებიც იყენებენ `currentUser()`
3. შექმენით ჰელპერ ფუნქციები ზოგიერთი განმეორებადი ლოგიკისთვის
4. გამოიყენეთ `withAuth` ლოგიკის გასამარტივებლად

## 8. ვებჰუკების მიგრაცია

Clerk-ის ვებჰუკები უნდა შეიცვალოს Supabase-ის ვებჰუკებით:

### Clerk ვერსია

```typescript
// src/app/api/webhooks/clerk/route.ts
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  // ვებჰუკის ლოგიკა...
}
```

### Supabase ვერსია

```typescript
// src/app/api/webhooks/supabase/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const payload = await req.json();
  const headerList = headers();
  const signature = headerList.get('x-signature');
  
  // შემოწმება და ლოგიკა...
  
  return NextResponse.json({ success: true });
}
```

## 9. ზოგადი მიდგომები

1. **თანმიმდევრული მიგრაცია**: ერთი მარშრუტი ერთ ჯერზე
2. **კოდის რეფაქტორინგი**: შექმენით `helpers` უტილიტები განმეორებადი კოდისთვის
3. **ტესტირება**: ყოველი მარშრუტის შემდეგ ტესტირება
4. **მიდლვეარის განახლება**: API-ებთან ერთად განაახლეთ მიდლვეარიც
5. **დაამატეთ კომენტარები**: დროებითი შენიშვნები შემდგომი განახლებისთვის