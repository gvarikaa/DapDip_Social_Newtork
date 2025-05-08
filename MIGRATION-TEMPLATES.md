# Clerk-დან Supabase-ზე მიგრაციის შაბლონები

ეს დოკუმენტი შეიცავს კოდის მაგალითებს, თუ როგორ უნდა განახლდეს Clerk-ის კოდი Supabase-ის გამოსაყენებლად. ეს შაბლონები შეგიძლიათ გამოიყენოთ როგორც გზამკვლევი სხვადასხვა კომპონენტებისთვის.

## 1. კლიენტის კომპონენტებში ავთენტიფიკაციის გამოყენება

### Clerk:
```tsx
import { useUser } from "@clerk/nextjs";

export default function MyComponent() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Hello, {user.username}</div>;
}
```

### Supabase:
```tsx
import { useAuth } from "@/lib/auth";

export default function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Hello, {user.email}</div>;
}
```

## 2. სერვერ კომპონენტებში ავთენტიფიკაციის გამოყენება

### Clerk:
```tsx
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function ServerComponent() {
  const { userId } = auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    return <div>Please sign in</div>;
  }
  
  return <div>Hello, {user.username}</div>;
}
```

### Supabase:
```tsx
import { getServerUser, requireAuth } from "@/lib/auth/server";

export default async function ServerComponent() {
  const { user, dbUser } = await getServerUser();
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  return <div>Hello, {user.email}</div>;
  
  // ან, ალტერნატიულად, შეგვიძლია გამოვიყენოთ requireAuth:
  // const user = await requireAuth(); // გადაამისამართებს თუ არ არის ავტორიზებული
  // return <div>Hello, {user.email}</div>;
}
```

## 3. API მარშრუტებში ავთენტიფიკაციის გამოყენება

### Clerk:
```ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // გავაგრძელოთ მოთხოვნის დამუშავება
  return NextResponse.json({ message: "Hello" });
}
```

### Supabase:
```ts
import { withAuth } from "@/lib/auth/api-route";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { user, dbUser }) => {
  // withAuth თავადვე ამოწმებს ავტორიზაციას და აბრუნებს შეცდომას თუ არ არის ავტორიზებული
  
  // გავაგრძელოთ მოთხოვნის დამუშავება
  return NextResponse.json({ message: "Hello" });
});

// ან ალტერნატიულად, თუ ხელით გვინდა დამუშავება:
import { getAuthenticatedUser } from "@/lib/auth/api-route";

export async function GET(request) {
  const { user } = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // გავაგრძელოთ მოთხოვნის დამუშავება
  return NextResponse.json({ message: "Hello" });
}
```

## 4. მომხმარებლის გასვლა (Logout)

### Clerk:
```tsx
import { useClerk } from "@clerk/nextjs";

export default function LogoutButton() {
  const { signOut } = useClerk();
  
  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  );
}
```

### Supabase:
```tsx
import { useAuth } from "@/lib/auth";

export default function LogoutButton() {
  const { signOut } = useAuth();
  
  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  );
}
```

## 5. სოციალური ავთენტიფიკაცია

### Clerk:
```tsx
import { useClerk } from "@clerk/nextjs";

export default function SocialButtons() {
  const { signIn } = useClerk();
  
  return (
    <div>
      <button onClick={() => signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/callback"
      })}>
        Sign in with Google
      </button>
    </div>
  );
}
```

### Supabase:
```tsx
import { signInWithOAuth } from "@/lib/auth";

export default function SocialButtons() {
  const handleGoogleSignIn = async () => {
    await signInWithOAuth('google', `${window.location.origin}/api/auth/callback`);
  };
  
  return (
    <div>
      <button onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>
    </div>
  );
}
```

## 6. მონაცემთა მოდელების სხვაობები

Clerk-ის ძირითადი მონაცემთა მოდელები მოიცავს `user`, `session`, `organization` და სხვა. Supabase-ის auth მოდული კი მოიცავს `user` და `session`.

### მომხმარებლის მონაცემების მიღება

#### Clerk:
```tsx
// userId გამოყენება
const { userId } = auth();
// ან
const { user } = useUser();
const username = user.username;
const firstName = user.firstName;
const lastName = user.lastName;
const email = user.emailAddresses[0].emailAddress;
const avatar = user.imageUrl;
```

#### Supabase:
```tsx
// userId გამოყენება
const { user } = await getServerUser();
const userId = user.id;
// ან
const { user } = useAuth();
const email = user.email;
// სხვა ინფორმაცია მოთავსებულია user.user_metadata-ში
const metadata = user.user_metadata;
const name = metadata?.name || '';
// ან დამატებითი მონაცემები dbUser-იდან
const { dbUser } = useAuth();
const username = dbUser?.username;
```

> **შენიშვნა**: Supabase შეინახავს ძირითად მომხმარებლის ინფორმაციას `auth.users` ცხრილში, მაგრამ დამატებითი მონაცემები უნდა შეინახოთ თქვენს საკუთარ მონაცემთა ბაზაში (მაგ: `public.users`). ამ შემთხვევაში ჩვენი ფუნქციები აბრუნებენ `dbUser` ობიექტს, რომელიც მოიცავს ამ დამატებით ინფორმაციას.