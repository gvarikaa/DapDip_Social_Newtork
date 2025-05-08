'use client';

// src/bunnyUtils.client.ts - კლიენტის მხარე (ბრაუზერში გამოსაყენებელი)
export interface BunnyConfig {
  enabled: boolean;
  storageZoneName: string;
  apiKey: string;
  pullZoneUrl: string;
}

// Bunny.net კონფიგურაცია
export const bunnyConfig: BunnyConfig = {
  enabled: typeof window !== 'undefined' && 
    !!process.env.NEXT_PUBLIC_BUNNY_PULLZONE_URL,
  storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || "",
  apiKey: "",  // კლიენტის მხარეს API key არ არის საჭირო
  pullZoneUrl: process.env.NEXT_PUBLIC_BUNNY_PULLZONE_URL || "",
};

// ლოკალური ფოტოს გამოყენების ფუნქცია, თუ Bunny.net არ არის კონფიგურირებული
export const useLocalImagesIfNeeded = (): boolean => {
  return !bunnyConfig.enabled;
};

// სრული URL-ის შექმნა Bunny CDN სურათისთვის
export const getBunnyUrl = (path: string | null | undefined, transformation?: string): string => {
  if (!path) return "";
  
  const useLocalImages = useLocalImagesIfNeeded();
  
  // თუ Bunny.net არ არის კონფიგურირებული ან გვაქვს სხვა ტიპის URL, დავაბრუნოთ როგორც არის
  if (useLocalImages || path.startsWith('http') || path.startsWith('/')) {
    return path;
  }
  
  // ტრანსფორმაციის პარამეტრები
  // Bunny.net-ის შემთხვევაში გამოვიყენოთ Image Processing API-ის პარამეტრები
  // მაგ: width=600&height=400
  let transformationString = "";
  if (transformation) {
    const params = transformation.split(",");
    transformationString = params.map(param => {
      const [key, value] = param.split("-");
      // გადავაკონვერტიროთ ImageKit პარამეტრები Bunny.net-ის ფორმატში
      if (key === "w") return `width=${value}`;
      if (key === "h") return `height=${value}`;
      if (key === "ar") {
        const [width, height] = value.split("-");
        const aspectRatio = `width=${width}&height=${height}`;
        return aspectRatio;
      }
      return `${key}=${value}`;
    }).join("&");
    
    if (transformationString) {
      transformationString = `?${transformationString}`;
    }
  }
  
  return `${bunnyConfig.pullZoneUrl}/${path}${transformationString}`;
};