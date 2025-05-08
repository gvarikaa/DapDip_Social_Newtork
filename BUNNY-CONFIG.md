# Bunny.net პროექტის კონფიგურაცია

ეს დოკუმენტი გთავაზობთ Bunny.net გამართვის ინსტრუქციას, რათა შეძლოთ ფაილების, სურათებისა და ვიდეოების ატვირთვა, შენახვა და ტრანსფორმაცია.

## 1. Bunny.net ანგარიშის შექმნა

1. გახსენით [Bunny.net](https://bunny.net/) და დარეგისტრირდით
2. შედით თქვენს ანგარიშში
3. დაამატეთ გადახდის მეთოდი (საწყისად შეგიძლიათ გამოიყენოთ უფასო ცდა)

## 2. Storage Zone-ის შექმნა

Storage Zone არის ფაილების შესანახი სივრცე, რომელსაც შემდეგ გამოიყენებთ თქვენს აპლიკაციაში.

1. გადადით "Storage" სექციაში
2. დააჭირეთ "Add Storage Zone" ღილაკს
3. შეავსეთ ფორმა:
   - **Name**: მიუთითეთ სახელი (მაგ., "your-app-storage")
   - **Region**: აირჩიეთ უახლოესი გეოგრაფიული რეგიონი
   - **Pricing**: აირჩიეთ "Volume" (სტანდარტული)
   - **Access Control**: აირჩიეთ "Private"
4. დააჭირეთ "Add Storage Zone"

### 2.1 Storage API გასაღების მიღება

1. შექმნილ Storage Zone-ზე დააჭირეთ "Manage"
2. გადადით "FTP & API Access" ჩანართში
3. დააკოპირეთ "Password" - ეს არის თქვენი API გასაღები
4. შეინახეთ ეს გასაღები გარემოს ცვლადებისთვის: `BUNNY_API_KEY`

## 3. Pull Zone-ის შექმნა

Pull Zone არის CDN (Content Delivery Network), რომელიც გამოიყენება თქვენი ფაილების სწრაფად მისაწოდებლად.

1. გადადით "Pull Zones" სექციაში
2. დააჭირეთ "Add Pull Zone" ღილაკს
3. შეავსეთ ფორმა:
   - **Name**: მიუთითეთ სახელი (მაგ., "your-app-cdn")
   - **Origin URL**: "bunnycdn.storage/your-storage-zone" (სადაც "your-storage-zone" არის თქვენი Storage Zone-ის სახელი)
   - **Type**: აირჩიეთ "Storage Zone"
   - **Storage Zone**: აირჩიეთ წინა ნაბიჯზე შექმნილი Storage Zone
4. დააჭირეთ "Add Pull Zone"

### 3.1 Pull Zone URL-ის მიღება

1. შექმნილ Pull Zone-ზე დააჭირეთ "Manage"
2. მთავარ გვერდზე იპოვით "Hostname" - ეს არის თქვენი Pull Zone URL
3. შეინახეთ ეს URL გარემოს ცვლადებისთვის: `NEXT_PUBLIC_BUNNY_PULLZONE_URL`

## 4. ოპტიმიზატორის გამართვა (PermaOptimizer)

ოპტიმიზატორი საშუალებას გაძლევთ, ავტომატურად შეცვალოთ სურათების ზომა, ფორმატი და ხარისხი.

1. Pull Zone-ის მართვის გვერდზე გადადით "Optimization" სექციაში
2. ჩართეთ "Image Processing Engine v2"
3. ჩართეთ "Smart Optimizations" და "AVIF/WebP" ფორმატები
4. შეინახეთ ცვლილებები

## 5. გარემოს ცვლადების კონფიგურაცია

თქვენი აპლიკაციისთვის `.env.local` ფაილში დაამატეთ შემდეგი ცვლადები:

```
# Bunny.net კონფიგურაცია
NEXT_PUBLIC_BUNNY_PULLZONE_URL=https://your-pullzone-hostname.b-cdn.net
BUNNY_API_KEY=your-api-key
BUNNY_STORAGE_ZONE_NAME=your-storage-zone-name

# დეველოპერის რეჟიმში ლოკალური ფაილების გამოყენება (არჩევითი)
NEXT_PUBLIC_USE_LOCAL_FILES=true
```

## 6. URL-ის ტრანსფორმაციები

Bunny.net საშუალებას გაძლევთ გარდაქმნათ სურათები URL პარამეტრების გამოყენებით.

### სურათის ზომის შეცვლა

```
https://your-pullzone.b-cdn.net/path/to/image.jpg?width=400&height=300
```

### სურათის მოჭრა

```
https://your-pullzone.b-cdn.net/path/to/image.jpg?width=400&height=300&aspect_ratio=4:3
```

### ხარისხის შეცვლა

```
https://your-pullzone.b-cdn.net/path/to/image.jpg?quality=80
```

### ფორმატის შეცვლა

```
https://your-pullzone.b-cdn.net/path/to/image.jpg?format=webp
```

## 7. უსაფრთხოება და წვდომის კონტროლი

### 7.1 უსაფრთხო გასაღების შექმნა

1. Pull Zone-ის მართვის გვერდზე გადადით "Security" სექციაში
2. "Token Authentication" განყოფილებაში დააჭირეთ "Enable"
3. შეინახეთ "Security Key" - ეს დაგჭირდებათ უსაფრთხო ლინკების გენერაციისთვის

### 7.2 გეოგრაფიული შეზღუდვები (არჩევითი)

1. Pull Zone-ის მართვის გვერდზე გადადით "Security" სექციაში
2. "Geo Restriction" განყოფილებაში შეგიძლიათ შეზღუდოთ წვდომა ქვეყნების მიხედვით

## 8. კოდის მაგალითები

### 8.1 ფაილის ატვირთვა Node.js-ით

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

async function uploadFile(filePath, fileName, folder) {
  const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
  const apiKey = process.env.BUNNY_API_KEY;
  
  // ფაილის წაკითხვა
  const fileContent = fs.readFileSync(filePath);
  
  // ფაილის ატვირთვა
  const uploadPath = folder ? `${folder}/${fileName}` : fileName;
  const response = await fetch(
    `https://storage.bunnycdn.com/${storageZone}/${uploadPath}`,
    {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: fileContent
    }
  );
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
  
  // დააბრუნეთ URL
  return `${process.env.NEXT_PUBLIC_BUNNY_PULLZONE_URL}/${uploadPath}`;
}
```

### 8.2 ფაილის წაშლა

```javascript
async function deleteFile(filePath) {
  const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
  const apiKey = process.env.BUNNY_API_KEY;
  
  const response = await fetch(
    `https://storage.bunnycdn.com/${storageZone}/${filePath}`,
    {
      method: 'DELETE',
      headers: {
        'AccessKey': apiKey
      }
    }
  );
  
  return response.ok;
}
```

## 9. პრობლემების გადაჭრა

### CORS პრობლემები

თუ CORS შეცდომები გაქვთ:

1. Pull Zone-ის მართვის გვერდზე გადადით "Headers" სექციაში
2. დაამატეთ ახალი ჰედერები:
   - Name: `Access-Control-Allow-Origin`, Value: `*` (ან თქვენი დომენი)
   - Name: `Access-Control-Allow-Methods`, Value: `GET, POST, PUT, DELETE, OPTIONS`
   - Name: `Access-Control-Allow-Headers`, Value: `Content-Type, Authorization`

### ფაილი არ ჩანს ატვირთვის შემდეგ

1. შეამოწმეთ Pull Zone კონფიგურაცია
2. ატვირთეთ Storage Browser-ში და დარწმუნდით, რომ ფაილი წარმატებით აიტვირთა
3. "Purge Cache" ღილაკზე დააჭირეთ Pull Zone-ის გვერდზე

## 10. მონიტორინგი და ანალიტიკა

1. Pull Zone-ის მართვის გვერდზე გადადით "Statistics" სექციაში
2. გამოიყენეთ სხვადასხვა ფილტრი და დიაგრამა ტრაფიკის, ბანდვიდთის და წვდომების სანახავად
3. დააყენეთ შეტყობინებები ლიმიტების მიღწევისას "Billing Alerts" სექციაში

## 11. მონაცემთა მიგრაცია

ImageKit-დან Bunny.net-ზე ფაილების გადატანისთვის:

1. გადმოტვირთეთ ყველა ფაილი ImageKit-დან
2. კოდში შეცვალეთ ImageKit URL-ები Bunny.net URL-ებით
3. ატვირთეთ ფაილები Bunny.net-ზე იგივე სტრუქტურით

## 12. რესურსები და დოკუმენტაცია

- [Bunny.net API დოკუმენტაცია](https://docs.bunny.net/reference/storage-api)
- [PermaOptimizer გზამკვლევი](https://support.bunny.net/hc/en-us/articles/360027448931-PermaOptimizer-Documentation)
- [Bunny.net მხარდაჭერის ცენტრი](https://support.bunny.net/hc/en-us)