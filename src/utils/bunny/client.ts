'use client';

/**
 * Bunny.net-ის კლიენტის მხარის უტილიტები
 * 
 * ეს მოდული შეიცავს ფუნქციებს, რომლებიც უსაფრთხოა ბრაუზერში გამოსაყენებლად.
 * აქ არ უნდა იყოს fs, path, და სხვა სერვერის მოდულები.
 */

import { getBunnyConfig, getBunnyUrl, UploadResult } from './config';

/**
 * Bunny.net-ის კონფიგურაციის ექსპორტი
 */
export const bunnyConfig = getBunnyConfig();

/**
 * Bunny.net URL-ის ექსპორტი
 */
export { getBunnyUrl, type UploadResult };

/**
 * ფაილის ტიპის დადგენა მისი მიმე-ტიპის მიხედვით
 * @param mimeType ფაილის მიმე-ტიპი
 * @returns ფაილის ტიპის კატეგორია: 'image', 'video', 'audio', 'document', და ა.შ.
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } 
  else if (mimeType.startsWith('video/')) {
    return 'video';
  } 
  else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } 
  else if (mimeType === 'application/pdf') {
    return 'pdf';
  } 
  else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'spreadsheet';
  } 
  else if (mimeType.includes('document') || mimeType.includes('word')) {
    return 'document';
  } 
  else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'presentation';
  } 
  else {
    return 'file';
  }
}

/**
 * ფაილის წინასწარი ნახვის URL-ის გენერატორი
 * @param file ფაილის ობიექტი
 * @returns ბრაუზერში ფაილის წინასწარი ნახვის URL
 */
export function getFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * ფაილის ტრანსფორმაციის პარამეტრების შექმნა
 * @param width სასურველი სიგანე
 * @param height სასურველი სიმაღლე
 * @param options დამატებითი ოპციები
 * @returns ტრანსფორმაციის პარამეტრები URL-ში გამოსაყენებლად
 */
export function createImageTransformation(
  width?: number,
  height?: number,
  options?: {
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    fit?: 'cover' | 'contain' | 'fill';
  }
): string {
  const params: string[] = [];
  
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (options?.quality) params.push(`quality=${options.quality}`);
  if (options?.format) params.push(`format=${options.format}`);
  if (options?.fit) params.push(`fit=${options.fit}`);
  
  return params.join('&');
}