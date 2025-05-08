// src/components/Groups/GroupAvatarEditor.tsx
"use client";

import React, { useState } from "react";
import { Camera, Upload, Check, X } from "lucide-react";

type GroupAvatarEditorProps = {
  groupId: string;
  initialIcon?: string;
  groupType?: string;
  onSuccess?: (iconUrl: string) => void;
  onCancel?: () => void;
  compact?: boolean; // კომპაქტური ვერსია ინტეგრირებისთვის
};

const GroupAvatarEditor: React.FC<GroupAvatarEditorProps> = ({
  groupId,
  initialIcon,
  groupType = "standard",
  onSuccess,
  onCancel,
  compact = false,
}) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialIcon);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const compactInputId = `avatar-upload-compact-${groupId}`;
  const fullInputId = `avatar-upload-${groupId}`;

  // სურათის ფაილის არჩევა
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      
      // პრევიუს URL გაწმენდა, თუ უკვე არსებობს
      if (previewUrl && previewUrl !== initialIcon) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // პრევიუს URL შექმნა
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };

  // ფოტოს ატვირთვა
  const uploadAvatar = async () => {
    if (!uploadFile) {
      setError("გთხოვთ აირჩიოთ ფაილი ატვირთვისთვის");
      return;
    }
    
    setIsUploading(true);
    setError("");
    
    try {
      // ფაილის ზომის შემოწმება - მაქს 2MB
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      if (uploadFile.size > MAX_FILE_SIZE) {
        throw new Error("ფაილი ძალიან დიდია. მაქსიმალური ზომაა 2MB");
      }
      
      // ფაილის ტიპის შემოწმება
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(uploadFile.type)) {
        throw new Error("დაუშვებელი ფაილის ტიპი. დაშვებულია მხოლოდ JPEG, PNG, GIF, WEBP და SVG");
      }
      
      // ფაილის ატვირთვა API-ს გამოყენებით
      const formData = new FormData();
      formData.append("file", uploadFile);
      
      console.log(`Attempting to upload to: /api/groups/${groupId}/avatar`);
      
      let data;
      try {
        const response = await fetch(`/api/groups/${groupId}/avatar`, {
          method: "POST",
          body: formData,
          credentials: "include", // აუცილებელია ავტორიზაციის ქუქების გასაგზავნად
          cache: "no-cache" // ქეშირების გამორთვა
        });
        
        console.log("Upload response status:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error response:", errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.error("Invalid JSON response:", errorText);
            throw new Error(`სერვერის პასუხი: ${response.status} ${response.statusText}`);
          }
          
          throw new Error(errorData.error || `აიქონის ატვირთვის შეცდომა: ${response.statusText}`);
        }
        
        // წარმატების შემთხვევაში პასუხის წაკითხვა
        data = await response.json();
      } catch (networkError) {
        console.error("Network error during upload:", networkError);
        throw new Error(`ქსელის შეცდომა: ${networkError.message || "დაკავშირების პრობლემა"}`);
      }
      
      // წარმატების შემთხვევაში გამოძახება
      if (onSuccess) {
        onSuccess(data.iconUrl);
      }
    } catch (err: any) {
      console.error("Failed to upload avatar:", err);
      setError(err.message || "აიქონის ატვირთვა ვერ მოხერხდა");
    } finally {
      setIsUploading(false);
    }
  };

  // გაუქმების ფუნქცია
  const handleCancel = () => {
    // პრევიუს URL გაწმენდა
    if (previewUrl && previewUrl !== initialIcon) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setUploadFile(null);
    setPreviewUrl(initialIcon);
    
    if (onCancel) {
      onCancel();
    }
  };

  if (compact) {
    // კომპაქტური ვერსია - გამოყენებული იქნება ჯგუფის გვერდზე პირდაპირ
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 transition-all duration-200 group-hover:opacity-100 opacity-0 rounded-xl overflow-hidden">
        <div className="flex gap-2">
          <input
            type="file"
            id={compactInputId}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            onClick={() => document.getElementById(compactInputId)?.click()}
            className="p-3 bg-black/70 rounded-full text-white hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            title="აიქონის ატვირთვა"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-dark p-6 rounded-lg border border-borderGray-dark shadow-2xl max-h-[90vh] overflow-y-auto w-full relative">
      <button 
        onClick={handleCancel}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-secondary hover:bg-secondary-light rounded-full transition-all duration-200"
        aria-label="დახურვა"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">ჯგუფის აიქონი</h2>
        <div className="flex gap-3">
          <button
            onClick={uploadAvatar}
            disabled={isUploading || !uploadFile}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-dark"
          >
            {isUploading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>ინახება...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>შენახვა</span>
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-light transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-secondary-dark"
          >
            <X className="w-5 h-5" />
            <span>გაუქმება</span>
          </button>
        </div>
      </div>
      
      {/* პრევიუ */}
      <div className="flex justify-center mb-8">
        <div className="relative w-40 h-40 bg-secondary-dark border-4 border-background rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Avatar preview" 
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = ''; // ცარიელი სურათი შეცდომის შემთხვევაში
                  setError("სურათის ჩატვირთვის შეცდომა");
                }}
              />
            ) : (
              <div className="text-gray-400 p-6">
                {groupType === "quantum" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 12v.01"></path>
                    <path d="M22 17.5a16 16 0 0 1-16 0"></path>
                    <path d="M2 8a19.1 19.1 0 0 1 10-2 19.1 19.1 0 0 1 10 2"></path>
                    <path d="M2 14a19.1 19.1 0 0 0 10 2 19.1 19.1 0 0 0 10-2"></path>
                    <path d="m8 9 4-3 4 3"></path>
                    <path d="m16 15-4 3-4-3"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* სურათის ატვირთვა */}
      <div>
        <h3 className="text-white font-medium text-sm mb-3">აირჩიეთ ჯგუფის აიქონი</h3>
        <div className="flex items-center gap-4">
          <div className={`flex-1 relative ${uploadFile ? 'border-accent bg-accent/5' : 'border-borderGray-dark'} border-2 border-dashed rounded-lg transition-all duration-200 hover:border-accent/50`}>
            <input
              type="file"
              id={fullInputId}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div 
              onClick={() => document.getElementById(fullInputId)?.click()}
              className="cursor-pointer flex flex-col items-center justify-center py-8 px-4"
            >
              <Upload className={`w-10 h-10 ${uploadFile ? 'text-accent' : 'text-gray-400'} mb-3 transition-all duration-200 group-hover:scale-110`} />
              <p className="text-gray-300 text-sm font-medium">
                {uploadFile ? uploadFile.name : "აირჩიეთ აიქონი..."}
              </p>
              <p className="text-gray-500 text-xs mt-2 text-center">
                რეკომენდებული ზომა: 400x400px, მაქსიმუმ 2MB
                <br />
                მხარდაჭერილი ფორმატები: JPG, PNG, GIF, SVG
              </p>
            </div>
          </div>
          
          {uploadFile && (
            <button
              onClick={() => {
                if (previewUrl && previewUrl !== initialIcon) {
                  URL.revokeObjectURL(previewUrl);
                }
                setUploadFile(null);
                setPreviewUrl(initialIcon);
              }}
              className="p-3 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
              title="გაუქმება"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* შეცდომის გამოტანა */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAvatarEditor;