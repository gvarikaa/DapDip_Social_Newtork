// src/utils/imagekit.ts
import ImageKit from "imagekit";
import fs from "fs";
import path from "path";

// ImageKit ინსტანციის შექმნა
export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY || "",
  privateKey: process.env.PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT || "",
});

// ლოკალური ფოტოს გამოყენების ფუნქცია, თუ ImageKit არ არის კონფიგურირებული
export const useLocalImagesIfNeeded = () => {
  const isImageKitConfigured = 
    !!process.env.NEXT_PUBLIC_PUBLIC_KEY &&
    !!process.env.PRIVATE_KEY &&
    !!process.env.NEXT_PUBLIC_URL_ENDPOINT;
  
  return !isImageKitConfigured;
};

// სრული URL-ის შექმნა ImageKit სურათისთვის
export const getImageKitUrl = (path: string | null | undefined, transformation?: string): string => {
  if (!path) return "";
  
  const useLocalImages = useLocalImagesIfNeeded();
  
  // თუ ImageKit არ არის კონფიგურირებული ან გვაქვს სხვა ტიპის URL, დავაბრუნოთ როგორც არის
  if (useLocalImages || path.startsWith('http') || path.startsWith('/')) {
    return path;
  }
  
  const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT || "";
  
  // ტრანსფორმაციის პარამეტრები (მაგ: "tr:w-600,h-400")
  const transformationParam = transformation ? `tr:${transformation}/` : "";
  
  return `${urlEndpoint}/${transformationParam}${path}`;
};

// სურათის ატვირთვა ImageKit-ზე
export const uploadToImageKit = async (
  file: Buffer | string, 
  fileName: string,
  folder: string = "",
  transformation?: string
): Promise<any> => {
  const useLocalImages = useLocalImagesIfNeeded();
  
  // თუ ImageKit არ არის კონფიგურირებული, შევინახოთ ლოკალურად
  if (useLocalImages) {
    return saveFileLocally(file, fileName, folder);
  }
  
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: file,
        fileName: fileName,
        folder: folder || undefined,
        ...(transformation && { transformation: { pre: transformation } })
      },
      function(error, result) {
        if (error) {
          console.error("ImageKit upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// სურათის ლოკალურად შენახვა
const saveFileLocally = async (
  file: Buffer | string,
  fileName: string,
  folder: string = ""
): Promise<{ filePath: string, url: string }> => {
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
    
    // დავაბრუნოთ ხელოვნური შედეგი, ImageKit-ის მსგავსი
    return {
      filePath: `/images/${folder}/${fileName}`, // ეს გამოიყენება fileId-ის ნაცვლად
      url: `/images/${folder}/${fileName}`,
    };
  } catch (error) {
    console.error("Local file save error:", error);
    throw error;
  }
};