// src/components/Groups/GroupCoverEditor.tsx
"use client";

import React, { useState } from "react";
import CoolBackground from "../Background/CoolBackground";
import { Camera, Upload, Check, X } from "lucide-react";

type GroupCoverEditorProps = {
  groupId: string;
  initialCover?: string;
  onSuccess?: (coverUrl: string) => void;
  onCancel?: () => void;
  compact?: boolean; // კომპაქტური ვერსია თაითლბარში გამოსაყენებლად
};

const GroupCoverEditor: React.FC<GroupCoverEditorProps> = ({
  groupId,
  initialCover,
  onSuccess,
  onCancel,
  compact = false,
}) => {
  const [selectedType, setSelectedType] = useState<string>(initialCover?.includes("gradient") ? "gradient" : "image");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(initialCover);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialCover);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const compactInputId = `cover-upload-compact-${groupId}`;
  const fullInputId = `cover-upload-full-${groupId}`;

  // სურათის ფაილის არჩევა
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      
      // პრევიუს URL გაწმენდა თუ არსებობს
      if (previewUrl && previewUrl !== initialCover) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // პრევიუს URL შექმნა
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
      setSelectedType("image");
    }
  };

  // ვიზუალური თემის არჩევა
  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    
    // თუ არჩეულია რომელიმე გრადიენტი/ტემა
    if (type !== "image") {
      if (previewUrl && previewUrl !== initialCover) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(undefined);
      setUploadFile(null);
      setCoverUrl(`/${type}`); // პირობითი URL გრადიენტისთვის
    }
  };

  // ფოტოს ატვირთვა
  const uploadCover = async () => {
    if (!uploadFile && selectedType === "image" && !initialCover) {
      setError("გთხოვთ აირჩიოთ სურათი ან თემა");
      return;
    }
    
    setIsUploading(true);
    setError("");
    
    try {
      if (selectedType === "image" && uploadFile) {
        // ფაილის ზომის შემოწმება - მაქს 5MB
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (uploadFile.size > MAX_FILE_SIZE) {
          throw new Error("ფაილი ძალიან დიდია. მაქსიმალური ზომაა 5MB");
        }
        
        // ფაილის ტიპის შემოწმება
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(uploadFile.type)) {
          throw new Error("დაუშვებელი ფაილის ტიპი. დაშვებულია მხოლოდ JPEG, PNG, GIF და WEBP");
        }
        
        // ფაილის ატვირთვა API-ს გამოყენებით
        const formData = new FormData();
        formData.append("file", uploadFile);
        
        console.log(`Attempting to upload to: /api/groups/${groupId}/cover`);
        
        const response = await fetch(`/api/groups/${groupId}/cover`, {
          method: "POST",
          body: formData,
          credentials: "include" // აუცილებელია ავტორიზაციის ქუქების გასაგზავნად
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.error("Invalid JSON response:", errorText);
            throw new Error(`სერვერის პასუხი: ${response.status} ${response.statusText}`);
          }
          
          throw new Error(errorData.error || `ქავერის ატვირთვის შეცდომა: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCoverUrl(data.coverUrl);
        
        // წარმატების შემთხვევაში გამოძახება
        if (onSuccess) {
          onSuccess(data.coverUrl);
        }
      } else {
        // გრადიენტის/თემის შემთხვევაში, მივაწოდოთ API-ს პირდაპირ
        console.log(`Attempting to update theme: /api/groups/${groupId}/cover (theme: ${selectedType})`);
        
        const response = await fetch(`/api/groups/${groupId}/cover`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coverType: selectedType,
            coverUrl: `/${selectedType}`, // პირობითი URL გრადიენტის/თემისთვის
          }),
          credentials: "include" // აუცილებელია ავტორიზაციის ქუქების გასაგზავნად
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.error("Invalid JSON response:", errorText);
            throw new Error(`სერვერის პასუხი: ${response.status} ${response.statusText}`);
          }
          
          throw new Error(errorData.error || `თემის განახლების შეცდომა: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // წარმატების შემთხვევაში გამოძახება
        if (onSuccess) {
          onSuccess(`/${selectedType}`);
        }
      }
    } catch (err: any) {
      console.error("Failed to upload cover:", err);
      setError(err.message || "ქავერის ატვირთვა ვერ მოხერხდა");
    } finally {
      setIsUploading(false);
    }
  };

  // გაუქმების ფუნქცია
  const handleCancel = () => {
    // პრევიუს URL გაწმენდა
    if (previewUrl && previewUrl !== initialCover) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setUploadFile(null);
    setPreviewUrl(initialCover);
    
    if (onCancel) {
      onCancel();
    }
  };

  if (compact) {
    // კომპაქტური ვერსია თაითლბარში გამოსაყენებლად
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 transition-all duration-200 group-hover:opacity-100 opacity-0">
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
            title="ქავერის ატვირთვა"
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
        <h2 className="text-xl font-bold text-white">ჯგუფის ქავერი</h2>
        <div className="flex gap-3">
          <button
            onClick={uploadCover}
            disabled={isUploading}
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
      <div className="relative w-full h-60 bg-secondary rounded-lg overflow-hidden mb-8 shadow-inner">
        <div className="w-full h-full overflow-hidden">
          {selectedType === "image" && previewUrl ? (
            <div className="w-full h-full relative">
              <img 
                src={previewUrl} 
                alt="Cover preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = ''; // ცარიელი სურათი შეცდომის შემთხვევაში
                  setError("სურათის ჩატვირთვის შეცდომა");
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
            </div>
          ) : (
            <CoolBackground
              type={selectedType as any}
              username={groupId}
              className="w-full h-full"
            />
          )}
        </div>
      </div>
      
      {/* არჩევანი */}
      <div className="space-y-8">
        {/* თემები */}
        <div>
          <h3 className="text-white font-medium text-sm mb-3">აირჩიეთ თემა</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["gradient", "triangles", "particles", "waves"].map((type) => (
              <div
                key={type}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedType === type 
                  ? "border-accent shadow-lg shadow-accent/20 scale-105 z-10" 
                  : "border-transparent hover:border-gray-600 hover:shadow-md"
                }`}
                onClick={() => handleTypeSelect(type)}
              >
                <div className="h-24 relative">
                  <CoolBackground
                    type={type as any}
                    username={groupId}
                    className="w-full h-full"
                  />
                </div>
                <p className="text-center py-2 text-sm font-medium capitalize">
                  {type === "gradient" ? "გრადიენტი" : 
                   type === "triangles" ? "სამკუთხედები" : 
                   type === "particles" ? "ნაწილაკები" : 
                   "ტალღები"}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* სურათის ატვირთვა */}
        <div>
          <h3 className="text-white font-medium text-sm mb-3">ან ატვირთეთ საკუთარი სურათი</h3>
          <div className="flex items-center gap-4">
            <div className={`flex-1 relative ${uploadFile ? 'border-accent bg-accent/5' : 'border-borderGray-dark'} border-2 border-dashed rounded-lg transition-all duration-200 hover:border-accent/50 ${selectedType === "image" ? "border-accent/70" : ""}`}>
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
                <Upload className={`w-10 h-10 ${uploadFile || selectedType === "image" ? 'text-accent' : 'text-gray-400'} mb-3 transition-all duration-200 group-hover:scale-110`} />
                <p className="text-gray-300 text-sm font-medium">
                  {uploadFile ? uploadFile.name : "აირჩიეთ სურათი..."}
                </p>
                <p className="text-gray-500 text-xs mt-2 text-center">
                  რეკომენდებული ზომა: 1200x400px, მაქსიმუმ 5MB
                  <br />
                  მხარდაჭერილი ფორმატები: JPG, PNG, GIF
                </p>
              </div>
            </div>
            
            {uploadFile && (
              <button
                onClick={() => {
                  if (previewUrl && previewUrl !== initialCover) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setUploadFile(null);
                  setPreviewUrl(initialCover);
                }}
                className="p-3 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                title="გაუქმება"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
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

export default GroupCoverEditor;