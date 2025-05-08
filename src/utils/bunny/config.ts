/**
 * Bunny.net კონფიგურაციის ფაილი
 * ეს ფაილი შეიცავს საერთო კონფიგურაციას Bunny.net-ის გამოყენებისთვის
 * როგორც კლიენტის, ისე სერვერის მხარეს
 */

interface BunnyConfig {
  enabled: boolean;
  storageZoneName: string;
  apiKey: string;
  pullZoneUrl: string;
}

export const getBunnyConfig = (): BunnyConfig => {
  // ლოკალური ფაილების რეჟიმის შემოწმება
  const useLocalFiles = process.env.NEXT_PUBLIC_USE_LOCAL_FILES === 'true';
  
  return {
    enabled: !useLocalFiles,
    storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || 'storage',
    apiKey: process.env.BUNNY_API_KEY || '',
    pullZoneUrl: process.env.NEXT_PUBLIC_BUNNY_PULLZONE_URL || 'https://example.b-cdn.net',
  };
};

/**
 * Bunny.net-ის CDN URL-ის გენერირება
 * @param path - ფაილის მისამართი
 * @param transformation - ტრანსფორმაციის პარამეტრები (width, height, და ა.შ.)
 * @returns სრული URL
 */
export const getBunnyUrl = (path: string | null | undefined, transformation?: string): string => {
  if (!path) return '';
  
  // თუ უკვე სრული URL-ია, დავაბრუნოთ ის
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }
  
  // ლოკალური ფაილების მხარდაჭერა
  const useLocalFiles = process.env.NEXT_PUBLIC_USE_LOCAL_FILES === 'true';
  if (useLocalFiles) {
    return `/uploads/${path}`;
  }
  
  // Bunny.net ინტეგრაცია
  const config = getBunnyConfig();
  const baseUrl = config.pullZoneUrl;
  
  // ტრანსფორმაციის დამატება
  if (transformation && path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return `${baseUrl}/${path}?${transformation}`;
  }
  
  // სტანდარტული URL
  return `${baseUrl}/${path}`;
};

/**
 * მიტვირთვის შედეგის ტიპი
 */
export interface UploadResult {
  success: boolean;
  fileName: string;
  path: string;
  url: string;
  size?: number;
  height?: number;
  width?: number;
  fileType?: string;
  error?: string;
}