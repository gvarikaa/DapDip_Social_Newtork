// src/bunnyUtils.ts

/**
 * Bunny.net Storage და CDN-თან სამუშაო უტილიტები
 */

// ენვ ცვლადები Bunny.net-ისთვის
const BUNNY_API_KEY = process.env.BUNNY_API_KEY; // API გასაღები
const BUNNY_STORAGE_ZONE = "dapdip"; // თქვენი storage zone სახელი
const BUNNY_CDN_URL = "https://dapdip.b-cdn.net"; // CDN URL

/**
 * ფაილის ატვირთვა Bunny.net Storage-ზე
 * @param buffer ფაილის ბაიტები
 * @param fileName ფაილის სახელი
 * @param directory დირექტორია (ფოლდერი)
 * @returns დაბრუნებული URL
 */
export async function uploadFileToBunny(
  buffer: Buffer,
  fileName: string,
  directory: string = ""
): Promise<{ url: string; success: boolean; statusCode: number }> {
  try {
    console.log(`[BunnyUtil] Starting upload of file ${fileName} to directory ${directory || 'root'}`);
    
    if (!BUNNY_API_KEY) {
      console.error("[BunnyUtil] BUNNY_API_KEY is not set in environment variables");
      return {
        url: "",
        success: false,
        statusCode: 500
      };
    }
    
    // საბოლოო path ფაილისთვის
    const path = directory ? `${directory}/${fileName}` : fileName;
    
    // API endpoint Bunny Storage-ისთვის
    const endpoint = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`;
    console.log(`[BunnyUtil] Uploading to endpoint: ${endpoint}`);
    
    // ვაგზავნით PUT მოთხოვნას ფაილის ასატვირთად
    console.log(`[BunnyUtil] Sending PUT request with content length: ${buffer.length} bytes`);
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "AccessKey": BUNNY_API_KEY, 
        "Content-Type": "application/octet-stream", // binary მონაცემებისთვის
        "Content-Length": buffer.length.toString()
      },
      body: buffer
    });

    console.log(`[BunnyUtil] Upload response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BunnyUtil] Bunny Storage upload error (${response.status}):`, errorText);
      return {
        url: "",
        success: false,
        statusCode: response.status
      };
    }
    
    // ვაბრუნებთ CDN URL-ს ატვირთული ფაილისთვის
    const cdnUrl = `${BUNNY_CDN_URL}/${path}`;
    console.log(`[BunnyUtil] Upload successful. CDN URL: ${cdnUrl}`);
    return {
      url: cdnUrl,
      success: true,
      statusCode: response.status
    };
  } catch (error) {
    console.error("[BunnyUtil] Exception during upload:", error);
    return {
      url: "",
      success: false,
      statusCode: 500
    };
  }
}

/**
 * ფაილის წაშლა Bunny.net Storage-დან
 * @param path ფაილის გზა (path)
 * @returns წარმატება/წარუმატებლობა
 */
export async function deleteFileFromBunny(path: string): Promise<boolean> {
  try {
    // თუ URL-ია, გარდავქმნათ path-ად
    if (path.startsWith(BUNNY_CDN_URL)) {
      path = path.replace(BUNNY_CDN_URL, "").replace(/^\//, "");
    }
    
    // API endpoint Bunny Storage-ისთვის
    const endpoint = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`;
    
    // ვაგზავნით DELETE მოთხოვნას
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "AccessKey": BUNNY_API_KEY || ""
      }
    });

    return response.ok;
  } catch (error) {
    console.error("ფაილის წაშლის შეცდომა:", error);
    return false;
  }
}

/**
 * Bunny CDN URL-ის შექმნა
 * @param path ფაილის path
 * @param width სურათის სიგანე (არჩევითი)
 * @param height სურათის სიმაღლე (არჩევითი)
 * @returns სრული CDN URL
 */
export function getBunnyCdnUrl(path: string, width?: number, height?: number): string {
  // თუ უკვე სრული URL-ია, დავაბრუნოთ როგორც არის
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // მოვაშოროთ წინა slash, თუ არსებობს
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  
  // დავამატოთ ზომის პარამეტრები, თუ მოცემულია
  const sizeParams = width && height ? `/fit-in/${width}x${height}` : "";
  
  // დავაბრუნოთ სრული URL
  return `${BUNNY_CDN_URL}${sizeParams}/${cleanPath}`;
}

/**
 * სურათის URL-ის შექმნა კონკრეტული ზომით
 * @param path სურათის path
 * @param width სიგანე
 * @param height სიმაღლე
 * @returns სრული CDN URL
 */
export function getImageUrl(path: string, width: number, height: number): string {
  return getBunnyCdnUrl(path, width, height);
}

/**
 * ვიდეოს URL-ის შექმნა
 * @param path ვიდეოს path
 * @returns სრული CDN URL
 */
export function getVideoUrl(path: string): string {
  return getBunnyCdnUrl(path);
}