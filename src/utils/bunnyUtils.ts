// src/utils/bunnyUtils.ts

import { createClient } from '@/utils/supabase/client';
import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * Bunny.net Storage და CDN-თან სამუშაო უტილიტები
 */

// ენვ ცვლადები Bunny.net-ისთვის
const BUNNY_API_KEY = process.env.BUNNY_API_KEY; // API გასაღები
const BUNNY_STORAGE_ZONE = "dapdip"; // თქვენი storage zone სახელი
const BUNNY_CDN_URL = "https://dapdip.b-cdn.net"; // CDN URL

/**
 * მიიღებს ავტორიზაციის ჰედერებს Bunny-სთვის
 * @param isServer არის თუ არა სერვერის მხარეს
 * @returns ავტორიზაციის ჰედერები და მომხმარებლის ID
 */
async function getBunnyAuthHeaders(isServer: boolean = false): Promise<{ headers: HeadersInit, userId: string | null }> {
  try {
    let userId: string | null = null;
    const headers: HeadersInit = {
      "AccessKey": BUNNY_API_KEY || "",
      "Content-Type": "application/octet-stream",
    };

    // მივიღოთ მიმდინარე სესია - სერვერის ან კლიენტის მხარეს
    if (isServer) {
      const supabase = createServerClient();
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id || null;
    } else {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id || null;
    }

    // დავამატოთ მომხმარებლის ID ჰედერებში
    if (userId) {
      headers["X-User-ID"] = userId;
    }

    return { headers, userId };
  } catch (error) {
    console.error("[BunnyUtil] ავტორიზაციის შეცდომა:", error);
    return { 
      headers: { 
        "AccessKey": BUNNY_API_KEY || "",
        "Content-Type": "application/octet-stream"
      }, 
      userId: null 
    };
  }
}

/**
 * მიიღებს მომხმარებლის პერსონალური შენახვის გზას
 * @param userId მომხმარებლის ID
 * @param directory დირექტორია
 * @returns მომხმარებლის პერსონალური გზა
 */
function getUserStoragePath(userId: string | null, directory: string): string {
  if (!userId) {
    return directory;
  }
  
  // თუ დირექტორია უკვე შეიცავს მომხმარებლის ID-ს, არ დავამატოთ ხელახლა
  if (directory.includes(`users/${userId}`)) {
    return directory;
  }
  
  // მომხმარებლის ID-ს დამატება გზაში
  return directory ? `users/${userId}/${directory}` : `users/${userId}`;
}

/**
 * ფაილის ატვირთვა Bunny.net Storage-ზე
 * @param buffer ფაილის ბაიტები
 * @param fileName ფაილის სახელი
 * @param directory დირექტორია (ფოლდერი)
 * @param isServer შესრულდება სერვერზე თუ კლიენტზე
 * @returns დაბრუნებული URL, წარმატების სტატუსი და სტატუს კოდი
 */
export async function uploadFileToBunny(
  buffer: Buffer,
  fileName: string,
  directory: string = "",
  isServer: boolean = false
): Promise<{ url: string; success: boolean; statusCode: number; userId: string | null }> {
  try {
    console.log(`[BunnyUtil] Starting upload of file ${fileName} to directory ${directory || 'root'}`);
    
    if (!BUNNY_API_KEY) {
      console.error("[BunnyUtil] BUNNY_API_KEY is not set in environment variables");
      return {
        url: "",
        success: false,
        statusCode: 500,
        userId: null
      };
    }
    
    // მივიღოთ ავტორიზაციის ჰედერები
    const { headers, userId } = await getBunnyAuthHeaders(isServer);
    
    // შევქმნათ მომხმარებლის პერსონალური დირექტორია
    const userDir = getUserStoragePath(userId, directory);
    
    // საბოლოო path ფაილისთვის
    const path = userDir ? `${userDir}/${fileName}` : fileName;
    
    // API endpoint Bunny Storage-ისთვის
    const endpoint = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`;
    console.log(`[BunnyUtil] Uploading to endpoint: ${endpoint}`);
    
    // დავამატოთ Content-Length ჰედერი
    const uploadHeaders = {
      ...headers,
      "Content-Length": buffer.length.toString()
    };
    
    // ვაგზავნით PUT მოთხოვნას ფაილის ასატვირთად
    console.log(`[BunnyUtil] Sending PUT request with content length: ${buffer.length} bytes`);
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: uploadHeaders,
      body: buffer
    });

    console.log(`[BunnyUtil] Upload response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BunnyUtil] Bunny Storage upload error (${response.status}):`, errorText);
      return {
        url: "",
        success: false,
        statusCode: response.status,
        userId
      };
    }
    
    // ვაბრუნებთ CDN URL-ს ატვირთული ფაილისთვის
    const cdnUrl = `${BUNNY_CDN_URL}/${path}`;
    console.log(`[BunnyUtil] Upload successful. CDN URL: ${cdnUrl}`);
    return {
      url: cdnUrl,
      success: true,
      statusCode: response.status,
      userId
    };
  } catch (error) {
    console.error("[BunnyUtil] Exception during upload:", error);
    return {
      url: "",
      success: false,
      statusCode: 500,
      userId: null
    };
  }
}

/**
 * ფაილის წაშლა Bunny.net Storage-დან
 * @param path ფაილის გზა (path)
 * @param isServer შესრულდება სერვერზე თუ კლიენტზე
 * @returns წარმატება/წარუმატებლობა
 */
export async function deleteFileFromBunny(path: string, isServer: boolean = false): Promise<{ success: boolean; userId: string | null }> {
  try {
    // მივიღოთ ავტორიზაციის ჰედერები
    const { headers, userId } = await getBunnyAuthHeaders(isServer);
    
    // თუ URL-ია, გარდავქმნათ path-ად
    if (path.startsWith(BUNNY_CDN_URL)) {
      path = path.replace(BUNNY_CDN_URL, "").replace(/^\//, "");
    }
    
    // API endpoint Bunny Storage-ისთვის
    const endpoint = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`;
    console.log(`[BunnyUtil] Deleting file at: ${endpoint}`);
    
    // ვაგზავნით DELETE მოთხოვნას
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers
    });

    console.log(`[BunnyUtil] Delete response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BunnyUtil] Bunny Storage delete error (${response.status}):`, errorText);
    }

    return { success: response.ok, userId };
  } catch (error) {
    console.error("[BunnyUtil] File deletion error:", error);
    return { success: false, userId: null };
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