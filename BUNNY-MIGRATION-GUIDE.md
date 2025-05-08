# ImageKit-დან Bunny.net-ზე გადასვლის გზამკვლევი

ეს გზამკვლევი აღწერს როგორ განახორციელოთ სრული მიგრაცია ImageKit-დან Bunny.net-ზე მედია ფაილების შესანახად და ჩასატვირთად.

## შესრულებული ცვლილებები

1. **Video კომპონენტი**: შეიცვალა IKVideo კომპონენტი სტანდარტული HTML video ელემენტით, რომელიც იყენებს Bunny.net URL-ებს.
2. **action.ts**: განახლდა ფაილის ატვირთვის ფუნქციონალი, რომ გამოიყენოს `uploadToBunny` ფუნქცია.
3. **server.js**: შეიცვალა ImageKit კონფიგურაციის შემოწმება Bunny.net კონფიგურაციით.
4. **avatar.ts**: განახლდა ავატარის და ქავერის URL-ების ფუნქციები, რომ დაბრუნდეს Bunny.net URL-ები.

## გარემოს ცვლადები

პროექტის გარემოს ცვლადები (`.env` ფაილი) უნდა განახლდეს:

**წასაშლელი ცვლადები:**
```
NEXT_PUBLIC_PUBLIC_KEY=  # ImageKit public key
PRIVATE_KEY=             # ImageKit private key
NEXT_PUBLIC_URL_ENDPOINT=  # ImageKit URL endpoint
```

**ახალი ცვლადები:**
```
NEXT_PUBLIC_BUNNY_PULLZONE_URL=  # Bunny.net Pull Zone URL
BUNNY_API_KEY=                   # Bunny.net Storage Zone API Key
BUNNY_STORAGE_ZONE_NAME=         # Bunny.net Storage Zone Name
```

## დარჩენილი ცვლილებები

რამდენიმე ფაილი შეიძლება საჭიროებდეს დამატებით განახლებას:

1. **package.json**:
   - წაშალეთ ImageKit დამოკიდებულებები:
     - "@imagekit/next"
     - "imagekit"
     - "imagekitio-next"

2. **next.config.ts**:
   - შეცვალეთ `remotePatterns`-ში ImageKit დომენები (ik.imagekit.io) Bunny.net დომენებით.

3. **Custom Image კომპონენტები**:
   - შეამოწმეთ სხვადასხვა Image კომპონენტები პროექტში, რომ დარწმუნდეთ რომ იყენებენ `getBunnyUrl` ფუნქციას.

4. **Middleware**:
   - თუ გაქვთ ImageKit-თან დაკავშირებული Middleware, შეცვალეთ ის Bunny.net ვერსიით.

## როგორ გამოვიყენოთ Bunny.net API

### სურათის URL-ის მიღება
```typescript
import { getBunnyUrl } from '../bunnyUtils';

// სურათის URL-ის მიღება
const imageUrl = getBunnyUrl('path/to/image.jpg');

// ტრანსფორმაციით
const thumbnailUrl = getBunnyUrl('path/to/image.jpg', 'width=300&height=200');
```

### ფაილის ატვირთვა
```typescript
import { uploadToBunny } from '../bunnyUtils';

// ატვირთვა
const uploadFile = async (file: File) => {
  const buffer = await file.arrayBuffer();
  
  const result = await uploadToBunny(
    buffer, 
    file.name, 
    'folder/path', 
    'width=600'
  );
  
  return result.url;
};
```

## ცვლილებების შემოწმება

მიგრაციის დასრულების შემდეგ:

1. წაშალეთ საბოლოოდ imagekit.ts ფაილი
2. გაუშვით აპლიკაცია ლოკალურად შესამოწმებლად 
3. დარწმუნდით რომ ყველა სურათი და ვიდეო სწორად ჩაიტვირთა
4. შეამოწმეთ ახალი ფაილების ატვირთვის ფუნქციონალი