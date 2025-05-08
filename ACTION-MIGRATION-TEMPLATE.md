# Action.ts ფაილის მიგრაცია Clerk-დან Supabase-ზე

ეს ფაილი შეიცავს მიმართულებებს, თუ როგორ უნდა განახლდეს `action.ts` ფაილი, რომ შეიცვალოს Clerk-ის იმპორტები Supabase-ის შესაბამისი იმპორტებით.

## ძირითადი ცვლილება

### Clerk ვერსია:
```typescript
import { auth } from "@clerk/nextjs/server";
```

### Supabase ვერსია:
```typescript
import { auth } from "@/lib/auth/server-only";
```

## მაგალითი: followUser ფუნქცია

### Clerk ვერსია:
```typescript
export const followUser = async (targetUserId: string) => {
  const { userId } = await auth();

  if (!userId) return;

  // ... კოდის დანარჩენი ნაწილი ...
};
```

### Supabase ვერსია:
```typescript
export const followUser = async (targetUserId: string) => {
  const { userId } = auth();

  if (!userId) return;

  // ... კოდის დანარჩენი ნაწილი ...
};
```

## მაგალითი: addComment ფუნქცია

### Clerk ვერსია:
```typescript
export const addComment = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const { userId } = await auth();

  if (!userId) return { success: false, error: true };

  // ... კოდის დანარჩენი ნაწილი ...
};
```

### Supabase ვერსია:
```typescript
export const addComment = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const { userId } = auth();

  if (!userId) return { success: false, error: true };

  // ... კოდის დანარჩენი ნაწილი ...
};
```

## მთლიანი ფაილის განახლების მაგალითი

```typescript
"use server";

import { auth } from "@/lib/auth/server-only";
import { prisma } from "./prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { uploadToBunny } from "./bunnyUtils.server";

export const followUser = async (targetUserId: string) => {
  const { userId } = auth();

  if (!userId) return;

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: { id: existingFollow.id },
    });
  } else {
    await prisma.follow.create({
      data: { followerId: userId, followingId: targetUserId },
    });
  }
};

// ... სხვა ფუნქციები ...

export const addPost = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const { userId } = auth();

  if (!userId) return { success: false, error: true };

  // ... ფუნქციის დანარჩენი ნაწილი ...
};
```

## მომხმარებლის მონაცემების მიღების სპეციფიკები

### Clerk ვერსია:
```typescript
// მომხმარებლის კომპლექსური ინფორმაციის მიღება
const user = await currentUser();
const email = user.emailAddresses[0].emailAddress;
const name = `${user.firstName} ${user.lastName}`;
```

### Supabase ვერსია:
```typescript
// მომხმარებლის კომპლექსური ინფორმაციის მიღება
const { user } = await getAuthUser();
const email = user.email;
const name = user.user_metadata?.name || '';
```

## გრძელვადიანი მიგრაციის სტრატეგია

1. პირველ რიგში, შეცვალეთ იმპორტი `@clerk/nextjs/server` -დან `@/lib/auth/server-only` -ზე
2. შეცვალეთ `await auth()` გამოძახება - Supabase-ის ვერსია არ არის ასინქრონული
3. შეცვალეთ `currentUser()` გამოძახებები `getAuthUser()` ფუნქციით
4. შეცვალეთ მონაცემების ველების მისამართები - მაგალითად, `user.username` გახდება `user.email` ან `user.email?.split('@')[0]`

## შენიშვნები:

- დროებით `auth()` და სხვა ფუნქციები იმულირებულია `/src/lib/auth/server-only.ts` ფაილში
- სრული მიგრაციისთვის, შეცვალეთ ეს დროებითი ფუნქციები რეალური Supabase იმპლემენტაციით
- მიაქციეთ ყურადღება, რომ Clerk-ის და Supabase-ის მონაცემთა მოდელები განსხვავდება ერთმანეთისგან