// src/bunnyUtils.server.ts - სერვერის მხარე
import fs from "fs";
import path from "path";
import { bunnyConfig, useLocalImagesIfNeeded } from './bunnyUtils.client';

export * from './bunnyUtils.client';  // რე-ექსპორტი კლიენტის ფუნქციების

export interface UploadResponse {
  success: boolean;
  filePath: string;
  url: string;
  fileId?: string;
  guid?: string;
  height?: number;
  width?: number;
  fileType?: "image" | "video";
}

// სურათის ატვირთვა Bunny.net-ზე
export const uploadToBunny = async (
  file: Buffer | string,
  fileName: string,
  folder: string = "",
  transformation?: string
): Promise<UploadResponse> => {
  const useLocalImages = useLocalImagesIfNeeded();
  
  // თუ Bunny.net არ არის კონფიგურირებული, შევინახოთ ლოკალურად
  if (useLocalImages) {
    return saveFileLocally(file, fileName, folder);
  }
  
  // მომზადება ატვირთვისთვის
  let buffer: Buffer;
  if (typeof file === 'string') {
    // Base64 სტრინგის შემთხვევაში
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = file;
  }

  // ფოლდერის გზის ფორმირება
  const folderPath = folder ? `${folder}/` : "";
  const filePath = `${folderPath}${fileName}`;

  try {
    // Bunny.net API მოთხოვნის გაგზავნა
    const response = await fetch(
      `https://storage.bunnycdn.com/${bunnyConfig.storageZoneName}/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': bunnyConfig.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: buffer
      }
    );

    if (!response.ok) {
      throw new Error(`Bunny.net upload failed: ${response.status} ${response.statusText}`);
    }

    // გავარკვიოთ ფაილის ტიპი სახელის მიხედვით
    const fileType = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "video";
    
    // შევამოწმოთ ატვირთვის შედეგი
    return {
      success: true,
      filePath: filePath,
      url: `${bunnyConfig.pullZoneUrl}/${filePath}`,
      fileId: filePath,
      guid: fileName,
      fileType: fileType
    };
  } catch (error) {
    console.error("Bunny.net upload error:", error);
    throw error;
  }
};

// სურათის ლოკალურად შენახვა
const saveFileLocally = async (
  file: Buffer | string,
  fileName: string,
  folder: string = ""
): Promise<UploadResponse> => {
  try {
    // საქაღალდის გზის შექმნა
    const dirPath = path.join(process.cwd(), 'public', 'images', folder);
    
    // საქაღალდის შექმნა თუ არ არსებობს
    if (!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // ფაილის გზა
    const filePath = path.join(dirPath, fileName);
    
    // ფაილის შენახვა
    if (typeof file === 'string') {
      // Base64 სტრინგის შემთხვევაში
      const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    } else {
      // ბაფერის შემთხვევაში
      fs.writeFileSync(filePath, file);
    }
    
    // გავარკვიოთ ფაილის ტიპი გაფართოების მიხედვით
    const fileType = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "video";
    
    // დავაბრუნოთ შედეგი
    return {
      success: true,
      filePath: `/images/${folder}/${fileName}`,
      url: `/images/${folder}/${fileName}`,
      fileType: fileType
    };
  } catch (error) {
    console.error("Local file save error:", error);
    throw error;
  }
};