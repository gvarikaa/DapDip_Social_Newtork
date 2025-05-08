# მიგრაციის გეგმა: Clerk → Supabase და ImageKit → Bunny.net

ეს დოკუმენტი შეიცავს მთლიან გეგმას, თუ როგორ უნდა მოხდეს წარმატებით მიგრაცია Clerk-დან Supabase-ზე ავთენტიფიკაციისთვის და ImageKit-დან Bunny.net-ზე მედია ფაილებისთვის.

## 1. ზოგადი ცვლილებები

### 1.1 ინსტალაცია

```bash
# ჯერ წაშალეთ Clerk-ის დამოკიდებულებები
npm uninstall @clerk/nextjs @clerk/themes @clerk/localizations

# ინსტალაცია Supabase-ის დამოკიდებულებების
npm install @supabase/supabase-js @supabase/ssr

# წაშალეთ ImageKit დამოკიდებულებები
npm uninstall @imagekit/next imagekit imagekitio-next
```

### 1.2 გარემოს ცვლადები

.env ფაილში:

```
# წაშალეთ
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=...
NEXT_PUBLIC_CLERK_SIGN_UP_URL=...
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=...
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=...
NEXT_PUBLIC_PUBLIC_KEY=...
PRIVATE_KEY=...
NEXT_PUBLIC_URL_ENDPOINT=...

# დაამატეთ
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_BUNNY_PULLZONE_URL=...
BUNNY_API_KEY=...
BUNNY_STORAGE_ZONE_NAME=...
```

## 2. ფაილების სტრუქტურა

ჩვენ უკვე შევქმენით ძირითადი ფაილები:

- `/src/lib/auth/` - Supabase ავთენტიფიკაციის ფაილები
- `/src/utils/supabase/` - Supabase კლიენტისა და სერვერის ფაილები
- `/src/bunnyUtils.client.ts` - Bunny.net კლიენტის მხარე
- `/src/bunnyUtils.server.ts` - Bunny.net სერვერის მხარე

## 3. მიგრაციის მსვლელობა

### 3.1 უკვე განხორციელებული ცვლილებები

1. ✅ შევქმენით bunnyUtils.client.ts და bunnyUtils.server.ts ფაილები
2. ✅ განვაახლეთ ძირითადი კომპონენტები (Video.tsx, FollowButton.tsx)
3. ✅ შევქმენით დროებითი auth კონტექსტი მიგრაციისთვის
4. ✅ შევქმენით მიგრაციის შაბლონები სხვა ფაილებისთვის
5. ✅ განვაახლეთ action.ts ფაილი Supabase ავთენტიფიკაციის გამოსაყენებლად
6. ✅ შევქმენით დებაგის API ენდპოინტი ავთენტიფიკაციის შესამოწმებლად
7. ✅ შევქმენით API მარშრუტების მიგრაციის შაბლონი (API-ROUTE-MIGRATION-TEMPLATE.md)
8. ✅ შევქმენით middleware.ts მიგრაციის შაბლონი (MIDDLEWARE-MIGRATION.md)
9. ✅ შევქმენით მიგრაციის პროგრესის შესამოწმებელი გვერდი (`/debug/auth-migration`)
10. ✅ განვაახლეთ posts API მარშრუტი Supabase ავთენტიფიკაციის გამოსაყენებლად
11. ✅ განვაახლეთ users/[userId] API მარშრუტი withAuth-ის გამოყენებით
12. ✅ შევქმენით API მარშრუტების ავტომატური კონვერტაციის სკრიპტი (`scripts/convert-api-routes.mjs`)

### 3.2 შემდეგი ნაბიჯები

მიგრაცია შეიძლება მოხდეს შემდეგი ეტაპების მიხედვით:

#### Phase 1: Bunny.net მიგრაცია

1. ნახეთ `src/components` საქაღალდის ყველა კომპონენტი, რომელიც იყენებს ImageKit
2. შეცვალეთ ImageKit იმპორტები Bunny.net იმპორტებით

#### Phase 2: Supabase ავთენტიფიკაციის მიგრაცია

1. შექმენით Supabase პროექტი და გამართეთ ავთენტიფიკაცია:
   - გამართეთ ელფოსტით ავთორიზაცია
   - გამართეთ სოციალური ავთორიზაცია (Google, GitHub)
   - გამართეთ OAuth რედირექტ URL-ები

2. განაახლეთ ყველა კლიენტის კომპონენტი, რომელიც იყენებს Clerk:
   - იმპორტი: `useUser()` → `useAuth()`

3. განაახლეთ API და სერვერის ფუნქციები:
   - იმპორტი: `auth()` → `auth()` (ჩვენი სერვერის ვერსიიდან)

#### Phase 3: ვებჰუკების და სინქრონიზაციის განახლება

1. განაახლეთ webhook/supabase მარშრუტი, რომ დააპროცესოს ავთენტიფიკაციის მოვლენები
2. განაახლეთ მიდლვეარი მარშრუტების გასაფილტრად

#### Phase 4: ინტერფეისი

1. განაახლეთ ავთორიზაციის გვერდები (SignIn, SignUp, ResetPassword)
2. თუ საჭიროა, დაუმატეთ AuthProvider ლეიაუთს

## 4. რეკომენდებული ცვლილებების თანმიმდევრობა

1. **დაიწყეთ სერვერის მხარიდან**: სერვერის კომპონენტები და API მარშრუტები
2. **შემდეგ კლიენტის მხარე**: useAuth ჰუკის გამოყენება და AuthProvider-ის დამატება
3. **ბოლოს ავთენტიფიკაციის გვერდები**: SignIn, SignUp და სხვა

## 5. ტესტირება

მიგრაციისას, აუცილებელია ყოველი ეტაპის შემდეგ ტესტირება:

1. **ავთენტიფიკაცია**: შესვლა, დარეგისტრირება, გამოსვლა
2. **მედია**: სურათების და ვიდეოების ატვირთვა და ჩვენება
3. **დაცული მარშრუტები**: შეამოწმეთ, რომ დაცული გვერდები კვლავ დაცულია
4. **API ავთენტიფიკაცია**: გადაამოწმეთ API მარშრუტები მუშაობენ ახალი ავთენტიფიკაციით

## 6. დამატებითი რჩევები

- **სტეპ-ბაი-სტეპ მიგრაცია**: ჯობია ნაბიჯ-ნაბიჯ განახორციელოთ ცვლილებები, ვიდრე ერთდროულად ყველაფერი
- **თავსებადობა**: დროებითი ფუნქციები აუცილებელია გარდამავალ პერიოდში კოდის თავსებადობისთვის
- **დოკუმენტაცია**: ყველა ცვლილება დააფიქსირეთ, რათა შეძლოთ უკან დაბრუნება პრობლემის შემთხვევაში

## 7. დამატებითი რესურსები

- [Supabase Auth დოკუმენტაცია](https://supabase.com/docs/guides/auth)
- [Bunny.net API დოკუმენტაცია](https://docs.bunny.net/reference/storage-api)
- [Next.js Middleware დოკუმენტაცია](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## 8. საკონტროლო სია

- [ ] Bunny.net კონფიგურაცია და გარემოს ცვლადები
- [ ] Supabase ავთენტიფიკაციის კონფიგურაცია
- [ ] Bunny.net უტილიტების მიგრაცია ყველა კომპონენტში
- [ ] Supabase ავთენტიფიკაციის კლიენტის მხარის მიგრაცია
- [ ] Supabase ავთენტიფიკაციის სერვერის მხარის მიგრაცია
- [ ] ავთენტიფიკაციის გვერდების განახლება
- [ ] ვებჰუკების განახლება
- [ ] პროექტის სრული ტესტირება