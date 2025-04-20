"use client";

import { useState, useRef } from 'react';
import Image from '../CustomImage';

type FileUploadProps = {
  onFileSelect: (file: File) => void;
};

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // ვამოწმებთ ფაილის ზომას (მაქს. 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('ფაილი ძალიან დიდია. მაქსიმალური ზომაა 5MB');
        return;
      }

      setIsUploading(true);
      
      // იმიტირებული დაყოვნება, რეალური ატვირთვისთვის გამოიყენეთ API
      setTimeout(() => {
        onFileSelect(selectedFile);
        setIsUploading(false);
        // გავასუფთავოთ ინფუთი შემდეგი ატვირთვისთვის
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        <Image 
          path="icons/image.svg" 
          alt="ფაილის ატვირთვა" 
          w={20} 
          h={20} 
          className="cursor-pointer" 
        />
      </button>
      
      {isUploading && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default FileUpload;