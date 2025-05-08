# Supabase პროექტის კონფიგურაცია

ეს დოკუმენტი გთავაზობთ Supabase პროექტის გამართვის სრულ ინსტრუქციას თქვენი ავთენტიფიკაციის სისტემისთვის. ეს არის მიგრაციის პროცესის მნიშვნელოვანი ნაწილი Clerk-დან Supabase-ზე გადასვლისთვის.

## 1. Supabase პროექტის შექმნა

1. გახსენით [Supabase](https://supabase.com/) და შედით თქვენს ანგარიშში
2. დააჭირეთ "New Project" ღილაკს
3. მიუთითეთ პროექტის სახელი და პაროლი (კარგად შეინახეთ!)
4. აირჩიეთ რეგიონი (ევროპული მომხმარებლებისთვის რეკომენდებულია eu-central)
5. დაელოდეთ პროექტის შექმნას (დაახლოებით 1-2 წუთი)

## 2. ავთენტიფიკაციის კონფიგურაცია

### 2.1 ელფოსტით რეგისტრაცია/ავტორიზაცია

1. გადადით "Authentication" განყოფილებაში
2. "Email Auth" სექციაში ჩართეთ "Enable Email Sign Up"
3. "Redirect URLs" განყოფილებაში დაამატეთ:
   - `http://localhost:3000/api/auth/callback` (ლოკალური განვითარებისთვის)
   - `https://your-production-url.com/api/auth/callback` (პროდაკშენისთვის)

### 2.2 სოციალური ავთენტიფიკაცია (არჩევითი)

#### Google ავთენტიფიკაცია
1. გადადით "Authentication > Providers" და აირჩიეთ Google
2. ჩართეთ "Enable Google OAuth"
3. [Google Cloud Console](https://console.cloud.google.com/)-ზე შექმენით OAuth 2.0 კლიენტი
4. შეიყვანეთ კლიენტის ID და საიდუმლო კოდი Supabase-ის კონფიგურაციაში
5. "Authorized redirect URI"-ში მიუთითეთ: `https://your-project-ref.supabase.co/auth/v1/callback`

#### GitHub ავთენტიფიკაცია
1. გადადით "Authentication > Providers" და აირჩიეთ GitHub
2. ჩართეთ "Enable GitHub OAuth"
3. [GitHub Developer Settings](https://github.com/settings/developers)-ში შექმენით ახალი OAuth აპლიკაცია
4. შეიყვანეთ კლიენტის ID და საიდუმლო კოდი Supabase-ის კონფიგურაციაში
5. "Authorization callback URL"-ში მიუთითეთ: `https://your-project-ref.supabase.co/auth/v1/callback`

## 3. ბაზის სქემა

Supabase ავტომატურად ქმნის auth სქემას და ცხრილებს ავთენტიფიკაციისთვის. ამასთან, მოგვიწევს შევქმნათ მომხმარებლის საჯარო პროფილის ცხრილი:

```sql
-- public სქემაში 'users' ცხრილის შექმნა
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  displayName TEXT,
  email TEXT,
  img TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  job TEXT,
  emailVerified TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ავტომატური დასრულების RLS პოლიტიკა
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- მომხმარებლის შექმნისას პროფილის ავტომატური შექმნის ფუნქცია
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, displayName)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(SPLIT_PART(NEW.email, '@', 1)),
    SPLIT_PART(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ტრიგერის მიმაგრება auth.users ცხრილთან
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();
```

ეს SQL კოდი შეგიძლიათ გაუშვათ Supabase-ის SQL რედაქტორში.

## 4. RLS პოლიტიკა (Row Level Security)

Supabase იყენებს RLS პოლიტიკებს, რომ განსაზღვროს ვის აქვს წვდომა რომელ მონაცემებზე. ქვემოთ მოცემულია რამდენიმე მაგალითი:

```sql
-- ძირითადი RLS ჩართვა
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- არსებული პოლიტიკების წაშლა
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- ახალი პოლიტიკების დამატება
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
```

## 5. გარემოს ცვლადები

თქვენი აპლიკაციისთვის დაამატეთ შემდეგი გარემოს ცვლადები `.env.local` ფაილში:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Bunny.net
NEXT_PUBLIC_BUNNY_PULLZONE_URL=https://your-pullzone.b-cdn.net
BUNNY_API_KEY=your-api-key
BUNNY_STORAGE_ZONE_NAME=your-storage-zone

# Development
NEXT_PUBLIC_USE_LOCAL_FILES=true  # დეველოპერის რეჟიმში
```

გარემოს ცვლადების მნიშვნელობები შეგიძლიათ ნახოთ:
- Supabase-ის მნიშვნელობები: Project Settings > API
- Bunny.net-ის მნიშვნელობები: Bunny.net Storage > Access > FTP & API Access

## 6. ვებჰუკების კონფიგურაცია (Webhooks)

Clerk-ის ვებჰუკების ნაცვლად, გამოიყენეთ Supabase-ის ვებჰუკები:

1. Supabase-ის პანელიდან გადადით "Database > Webhooks"
2. დააჭირეთ "Create a new webhook"
3. მიუთითეთ სახელი: "auth-events"
4. HTTP მეთოდად აირჩიეთ "POST"
5. URL-ში მიუთითეთ თქვენი ვებჰუკ ჰენდლერი: `https://your-domain.com/api/webhooks/supabase`
6. მონიშნეთ ივენთები, რომლებზეც გინდათ რეაგირება (auth.signup, auth.login, და ა.შ.)
7. შექმენით საიდუმლო კოდი "Signing Secret" სექციაში
8. დაამატეთ ეს საიდუმლო კოდი თქვენს .env ფაილში:
   ```
   SUPABASE_WEBHOOK_SECRET=your-webhook-secret
   ```

## 7. სტორიჯის კონფიგურაცია (ფაილების შენახვისთვის)

Supabase-ს აქვს ჩაშენებული სტორიჯი, რომელიც შეგიძლიათ გამოიყენოთ Bunny.net-ის ნაცვლად (არჩევითი):

1. გადადით "Storage" სექციაში
2. დააჭირეთ "Create new bucket"
3. სახელად მიუთითეთ "media"
4. ჩართეთ "Public bucket" თუ საჯარო წვდომა გინდათ
5. დააკონფიგურეთ RLS პოლიტიკები:

```sql
-- სტორიჯის პოლიტიკები
CREATE POLICY "Media is accessible to everyone"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Users can update their own media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 8. შემდგომი ნაბიჯები

Supabase პროექტის კონფიგურაციის შემდეგ, შეგიძლიათ დაიწყოთ მისი ინტეგრაცია აპლიკაციაში:

1. დარწმუნდით, რომ შეინახეთ სწორი გარემოს ცვლადები
2. სცადეთ პროექტის გაშვება დეველოპერის რეჟიმში: `npm run dev`
3. შეამოწმეთ ავთენტიფიკაცია `/debug/auth-migration` გვერდზე
4. შეასრულეთ მიგრაციის სკრიპტი API მარშრუტების განსაახლებლად
5. განაახლეთ კლიენტის კომპონენტები, რომლებიც იყენებენ ავთენტიფიკაციას

## 9. პრობლემების გადაჭრა

- **401 შეცდომა API გამოძახებებისას**: შეამოწმეთ Supabase-ის საჯარო გასაღები (anon key)
- **აიდი-ების შეუსაბამობა**: დარწმუნდით, რომ Supabase-ის მომხმარებლების ID-ები შეესაბამება არსებულ მონაცემებს
- **CORS შეცდომები**: Supabase-ის პანელიდან დაამატეთ თქვენი დომენი "Authentication > URL Configuration" სექციაში

## 10. რესურსები

- [Supabase Auth დოკუმენტაცია](https://supabase.com/docs/guides/auth/overview)
- [Supabase JavaScript კლიენტი](https://supabase.com/docs/reference/javascript/start)
- [Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security გზამკვლევი](https://supabase.com/docs/guides/database/row-level-security)