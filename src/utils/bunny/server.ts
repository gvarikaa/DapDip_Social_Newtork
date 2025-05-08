'use server';

/**
 * Bunny.net-ის სერვერის მხარის უტილიტები
 * 
 * ეს მოდული შეიცავს ფუნქციებს, რომლებიც მხოლოდ სერვერის მხარეს უნდა გამოვიყენოთ.
 * ის იყენებს fs, fetch, და სხვა მოდულებს, რომლებიც არ არის ხელმისაწვდომი ბრაუზერში.
 */

import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { randomUUID } from 'crypto';
import { getBunnyConfig, getBunnyUrl, UploadResult } from './config';

/**
 * ფაილის ატვირთვა Bunny.net-ზე
 * @param file ფაილის ბაფერი ან მისამართი
 * @param fileName ფაილის სახელი
 * @param folder საქაღალდე, სადაც ფაილი უნდა აიტვირთოს
 * @param transformation ტრანსფორმაციის პარამეტრები
 * @returns ატვირთვის შედეგი
 */
export async function uploadToBunny(
  file: Buffer | string,
  fileName: string,
  folder: string = "",
  transformation?: string
): Promise<UploadResult> {
  const config = getBunnyConfig();
  
  // ვამოწმებთ, ჩართულია თუ არა Bunny.net
  if (!config.enabled) {
    // ლოკალური ფაილების შენახვა, თუ Bunny.net გამორთულია
    return saveLocalFile(file, fileName, folder);
  }
  
  // უნიკალური სახელის გენერაცია
  const uniqueFileName = generateUniqueFileName(fileName);
  const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
  
  // ფაილის ტიპის განსაზღვრა გაფართოების მიხედვით
  const fileExtension = path.extname(fileName).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension);
  const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(fileExtension);
  
  try {
    let fileBuffer: Buffer;
    
    // ფაილის შემოწმება, არის ბაფერი თუ მისამართი
    if (typeof file === 'string') {
      fileBuffer = fs.readFileSync(file);
    } else {
      fileBuffer = file;
    }
    
    // ფაილის ზომა
    const fileSize = fileBuffer.length;
    
    // Bunny.net-ზე ატვირთვა
    const endpoint = `https://storage.bunnycdn.com/${config.storageZoneName}/${filePath}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'AccessKey': config.apiKey,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize.toString()
      },
      body: fileBuffer
    });
    
    if (!response.ok) {
      console.error('Bunny.net upload error:', await response.text());
      throw new Error(`Bunny.net upload failed: ${response.status} ${response.statusText}`);
    }
    
    // ფაილის სრული URL
    const fileUrl = getBunnyUrl(filePath, transformation);
    
    // სურათის ზომების დადგენა - ცარიელია, რადგან სურათის ზომების დადგენა
    // მოითხოვს დამატებით ბიბლიოთეკებს
    let width = 0;
    let height = 0;
    
    return {
      success: true,
      fileName: uniqueFileName,
      path: filePath,
      url: fileUrl,
      size: fileSize,
      width: isImage ? width : undefined,
      height: isImage ? height : undefined,
      fileType: isImage ? 'image' : isVideo ? 'video' : 'file'
    };
  } catch (error) {
    console.error('Error uploading to Bunny.net:', error);
    return {
      success: false,
      fileName,
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * ფაილის წაშლა Bunny.net-დან
 * @param filePath ფაილის მისამართი
 * @returns წარმატების სტატუსი
 */
export async function deleteFromBunny(filePath: string): Promise<boolean> {
  const config = getBunnyConfig();
  
  // ვამოწმებთ, ჩართულია თუ არა Bunny.net
  if (!config.enabled) {
    // ლოკალური ფაილის წაშლა, თუ Bunny.net გამორთულია
    return deleteLocalFile(filePath);
  }
  
  try {
    const endpoint = `https://storage.bunnycdn.com/${config.storageZoneName}/${filePath}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'AccessKey': config.apiKey
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting from Bunny.net:', error);
    return false;
  }
}

/**
 * უნიკალური ფაილის სახელის გენერაცია
 * @param originalName საწყისი ფაილის სახელი
 * @returns უნიკალური ფაილის სახელი
 */
function generateUniqueFileName(originalName: string): string {
  const extension = path.extname(originalName);
  const uuid = randomUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}${extension}`;
}

/**
 * ფაილის ლოკალურად შენახვა (დეველოპერის რეჟიმისთვის)
 * @param file ფაილის ბაფერი ან მისამართი
 * @param fileName ფაილის სახელი
 * @param folder საქაღალდე, სადაც ფაილი უნდა შეინახოს
 * @returns შენახვის შედეგი
 */
async function saveLocalFile(
  file: Buffer | string,
  fileName: string,
  folder: string = ""
): Promise<UploadResult> {
  try {
    // შევქმნათ uploads საქაღალდე, თუ არ არსებობს
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // შევქმნათ ფოლდერი, თუ მითითებულია და არ არსებობს
    let targetDir = uploadsDir;
    if (folder) {
      targetDir = path.join(uploadsDir, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }
    
    // უნიკალური სახელის გენერაცია
    const uniqueFileName = generateUniqueFileName(fileName);
    const filePath = path.join(targetDir, uniqueFileName);
    const relativePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // ფაილის შენახვა
    if (typeof file === 'string') {
      fs.copyFileSync(file, filePath);
    } else {
      fs.writeFileSync(filePath, file);
    }
    
    // ფაილის ტიპის განსაზღვრა გაფართოების მიხედვით
    const fileExtension = path.extname(fileName).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension);
    const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(fileExtension);
    
    return {
      success: true,
      fileName: uniqueFileName,
      path: relativePath,
      url: `/uploads/${relativePath}`,
      size: fs.statSync(filePath).size,
      fileType: isImage ? 'image' : isVideo ? 'video' : 'file'
    };
  } catch (error) {
    console.error('Error saving local file:', error);
    return {
      success: false,
      fileName,
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * ფაილის ლოკალურად წაშლა (დეველოპერის რეჟიმისთვის)
 * @param filePath ფაილის მისამართი
 * @returns წარმატების სტატუსი
 */
async function deleteLocalFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting local file:', error);
    return false;
  }
}