"use client";

import React, { useRef, useState, useTransition } from "react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation"; // დავამატეთ router იმპორტი
import ProfileAvatar from "@/components/Avatar/ProfileAvatar";
import {
  Image as ImageIcon,
  Video,
  Smile,
  MapPin,
  Calendar,
  BarChart2,
  X,
  Edit,
  EyeOff,
  ImagePlus,
  Check,
  Loader2
} from "lucide-react";
import { addPost } from "@/action";
import NextImage from "next/image";
import Image from "./Image"; // შენი კასტომური Image კომპონენტი
import dynamic from 'next/dynamic';


// დინამიურად ვტვირთავთ BigHeadsAvatar კომპონენტს, რათა თავიდან ავიცილოთ SSR პრობლემები
const BigHeadsAvatar = dynamic(() => import('@/components/Avatar/BigHeadsAvatar'), { 
  ssr: false,
  loading: () => <div className="w-11 h-11 bg-secondary rounded-full animate-pulse"></div>
});

// მედიის ფაილის ტიპი
type MediaFile = {
  file: File;
  id: string;
  previewUrl: string;
  type: 'image' | 'video';
  settings: {
    type: "original" | "wide" | "square";
    sensitive: boolean;
  };
};

const Share = () => {
  const router = useRouter(); // Next.js router
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(-1);
  const [globalSettings, setGlobalSettings] = useState({
    type: "original" as "original" | "wide" | "square",
    sensitive: false
  });
  const [applyToAll, setApplyToAll] = useState(false);
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [fileSelectionError, setFileSelectionError] = useState<string | null>(null);
  const [formState, setFormState] = useState({ success: false, error: false });
  const [showSuccess, setShowSuccess] = useState(false); // დამატებული სტეიტი წარმატების ანიმაციისთვის
  
  // React useTransition ჰუკი - აუცილებელია Next.js action-ებისთვის
  const [isPending, startTransition] = useTransition();
  
  const MAX_CHAR_COUNT = 2200;
  const MAX_FILES = 10; // მაქსიმალური დასაშვები ფაილების რაოდენობა

  const { user, isLoading } = useAuth();
  const isLoaded = !isLoading;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // ტექსტის ცვლილების დამუშავება, სიმბოლოების რაოდენობის გამოთვლა
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
  };

  // ფაილის არჩევის ფუნქცია - გაუმჯობესებული ვერსია
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ვასუფთავებთ წინა შეცდომებს
    setFileSelectionError(null);
    
    if (!e.target.files || e.target.files.length === 0) {
      console.log("არ არის არჩეული ფაილები");
      return;
    }
    
    console.log(`არჩეულია ${e.target.files.length} ფაილი`);
    
    // ფაილების გადაქცევა მასივად
    const selectedFiles = Array.from(e.target.files);
    
    // შევამოწმოთ ლიმიტი
    if (mediaFiles.length + selectedFiles.length > MAX_FILES) {
      setFileSelectionError(`შეგიძლიათ მაქსიმუმ ${MAX_FILES} ფაილის ატვირთვა`);
      // გავასუფთაოთ ინფუთი
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // დავამუშავოთ ფაილები და შევქმნათ ახალი MediaFile ობიექტები
    const newMediaFiles = selectedFiles.map(file => {
      const fileId = Math.random().toString(36).substring(2, 9);
      const previewUrl = URL.createObjectURL(file);
      const fileType = file.type.startsWith('image/') ? 'image' as const : 'video' as const;
      
      console.log(`ფაილი დამუშავებულია: ${file.name}, ტიპი: ${fileType}`);
      
      return {
        file,
        id: fileId,
        previewUrl,
        type: fileType,
        settings: { ...globalSettings }
      };
    });
    
    // დავამატოთ ახალი ფაილები არსებულ მასივში
    setMediaFiles(prevFiles => [...prevFiles, ...newMediaFiles]);
    console.log(`დაემატა ${newMediaFiles.length} ახალი ფაილი`);
    
    // გავასუფთაოთ ინფუთი მომავალი ატვირთვებისთვის
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ფაილის წაშლა
  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      // თუ ვშლით ფაილს, რომელიც რედაქტირდება, დავხუროთ რედაქტორი
      if (currentEditIndex !== -1 && prev[currentEditIndex]?.id === id) {
        setIsEditorOpen(false);
        setCurrentEditIndex(-1);
      }
      return updated;
    });
    
    console.log(`ფაილი წაშლილია, ID: ${id}`);
  };

  // ფაილის რედაქტირება
  const editFile = (id: string) => {
    const index = mediaFiles.findIndex(file => file.id === id);
    if (index !== -1) {
      setCurrentEditIndex(index);
      setIsEditorOpen(true);
      
      console.log(`ფაილის რედაქტირება, ID: ${id}, ინდექსი: ${index}`);
    }
  };

  // კონკრეტული ფაილის პარამეტრების განახლება
  const updateFileSettings = (id: string, settings: { type: "original" | "wide" | "square"; sensitive: boolean }) => {
    setMediaFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, settings } : file
      )
    );
    
    console.log(`ფაილის პარამეტრები განახლებულია, ID: ${id}`);
  };

  // ყველა ფაილის პარამეტრების განახლება
  const updateAllFileSettings = (settings: { type: "original" | "wide" | "square"; sensitive: boolean }) => {
    setMediaFiles(prev => 
      prev.map(file => ({ ...file, settings }))
    );
    setGlobalSettings(settings);
    
    console.log("ყველა ფაილის პარამეტრები განახლებულია");
  };

  // რედაქტორის დახურვა
  const closeEditor = () => {
    // თუ "ყველა ფაილზე გამოყენება" არჩეულია
    if (applyToAll && currentEditIndex !== -1) {
      const currentSettings = mediaFiles[currentEditIndex].settings;
      updateAllFileSettings(currentSettings);
    }
    
    setIsEditorOpen(false);
    setCurrentEditIndex(-1);
    
    console.log("რედაქტორი დაიხურა");
  };

  // მედიის კლასების მიღება ტიპის მიხედვით
  const getMediaClasses = (type: "original" | "wide" | "square") => {
    switch(type) {
      case "square":
        return "aspect-square object-cover";
      case "wide":
        return "aspect-video object-cover";
      default:
        return "max-h-[300px] object-contain";
    }
  };

  // ფაილის არჩევის დიალოგის გახსნა
  const openFileDialog = () => {
    if (fileInputRef.current) {
      console.log("ფაილის არჩევის დიალოგი იხსნება...");
      fileInputRef.current.click();
    }
  };

  // ფორმის გასუფთავება
  const resetForm = () => {
    setText("");
    setCharCount(0);
    setMediaFiles([]);
    setGlobalSettings({
      type: "original",
      sensitive: false
    });
    setFileSelectionError(null);
    
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  // წარმატების შემდეგ UI განახლება
  const handlePostSuccess = () => {
    resetForm();
    setFormState({ success: true, error: false });
    
    // წარმატების ანიმაცია
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    
    // განვაახლოთ UI რათა ახალი პოსტი გამოჩნდეს
    router.refresh(); // გამოვიყენოთ router.refresh() ნაცვლად window.location.reload()-ისა
  };

  // ფორმის წარდგენის ფუნქცია - გაუმჯობესებული ვერსია
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() && mediaFiles.length === 0) {
      setFileSelectionError("დაამატეთ ტექსტი ან მედია");
      return;
    }
    
    setIsUploading(true);
    setFileSelectionError(null);
    
    // აქ ვიყენებთ startTransition-ს action-ისთვის
    startTransition(async () => {
      try {
        console.log("პოსტის ატვირთვა დაიწყო:", {
          text: text.length > 20 ? `${text.substring(0, 20)}...` : text,
          mediaFilesCount: mediaFiles.length
        });
        
        // თუ არ გვაქვს ფაილები, ვიყენებთ ჩვეულებრივ addPost ქმედებას
        if (mediaFiles.length === 0) {
          const formData = new FormData();
          formData.append("desc", text);
          formData.append("isSensitive", "false");
          
          const result = await addPost(formState, formData);
          if (result.success) {
            handlePostSuccess();
          } else {
            setFormState({ success: false, error: true });
            setFileSelectionError("პოსტის დამატება ვერ მოხერხდა");
          }
        } else {
          // თუ გვაქვს ფაილები, მივყვეთ ახალ გზას
          // პირველი ფაილის გაგზავნა addPost action-ით
          const firstMedia = mediaFiles[0];
          const formData = new FormData();
          formData.append("desc", text);
          formData.append("file", firstMedia.file);
          formData.append("imgType", firstMedia.settings.type);
          formData.append("isSensitive", firstMedia.settings.sensitive ? "true" : "false");
          
          console.log("ვაგზავნი პირველ ფაილს addPost-ით:", firstMedia.file.name);
          
          const result = await addPost(formState, formData);
          if (result.success) {
            handlePostSuccess();
          } else {
            setFormState({ success: false, error: true });
            setFileSelectionError("პოსტის დამატება ვერ მოხერხდა");
          }
        }
      } catch (error) {
        console.error("ატვირთვის შეცდომა:", error);
        setFileSelectionError(`ფაილების ატვირთვისას მოხდა შეცდომა: ${(error as Error).message}`);
        setFormState({ success: false, error: true });
      } finally {
        setIsUploading(false);
      }
    });
  };

  // ავატარის რენდერი
  const renderAvatar = () => {
    if (!isLoaded) {
      return <div className="w-11 h-11 bg-secondary rounded-full animate-pulse"></div>;
    }
    
    return (
      <ProfileAvatar
        imageUrl={user?.img || undefined}
        username={user?.username || "user"}
        gender={user?.gender || undefined}
        size="sm"
        className="h-full w-full"
      />
    );
  };

  return (
    <form
      ref={formRef}
      className="relative bg-background rounded-xl p-4 mb-6 border border-borderGray-dark shadow-card transition-all duration-300"
      onSubmit={handleSubmit}
    >
      {/* წარმატების ნოტიფიკაცია */}
      {showSuccess && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10 animate-fade-in-out">
          პოსტი წარმატებით გამოქვეყნდა!
        </div>
      )}
      
      <div className="flex gap-3">
        {/* ავატარი */}
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-button">
          {renderAvatar()}
        </div>
        
        {/* კონტენტის არეა */}
        <div className="flex-1 space-y-3">
          {/* ტექსტის ფორმა */}
          <textarea
            name="desc"
            value={text}
            onChange={handleTextChange}
            placeholder="რა ხდება?"
            className="w-full bg-transparent outline-none placeholder-gray-500 text-textGrayLight text-lg resize-none min-h-[80px]"
            maxLength={MAX_CHAR_COUNT}
          />
          
          {/* შეცდომის შეტყობინება */}
          {fileSelectionError && (
            <div className="bg-accent/10 text-accent p-2 rounded-lg text-sm">
              {fileSelectionError}
            </div>
          )}
          
          {/* მედიის პრევიუ */}
          {mediaFiles.length > 0 && (
            <div className={`grid ${mediaFiles.length > 1 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-2 rounded-xl overflow-hidden`}>
              {mediaFiles.map((mediaFile) => (
                <div key={mediaFile.id} className="relative overflow-hidden rounded-lg shadow-card border border-borderGray-dark">
                  {mediaFile.type === 'image' ? (
                    <NextImage
                      src={mediaFile.previewUrl}
                      alt=""
                      width={400}
                      height={400}
                      className={`w-full ${getMediaClasses(mediaFile.settings.type)} ${mediaFile.settings.sensitive ? 'blur-md' : ''}`}
                    />
                  ) : (
                    <video
                      src={mediaFile.previewUrl}
                      controls={false}
                      className={`w-full ${getMediaClasses(mediaFile.settings.type)} ${mediaFile.settings.sensitive ? 'blur-md' : ''}`}
                    />
                  )}
                  
                  {/* ორვლეი/overlay ღილაკები */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        editFile(mediaFile.id);
                      }}
                      className="p-1.5 bg-secondary/70 backdrop-blur-sm rounded-full text-white hover:bg-secondary transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFile(mediaFile.id);
                      }}
                      className="p-1.5 bg-secondary/70 backdrop-blur-sm rounded-full text-white hover:bg-secondary transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {/* სენსიტიური იკონი */}
                  {mediaFile.settings.sensitive && (
                    <div className="absolute bottom-2 left-2 p-1.5 bg-secondary/70 backdrop-blur-sm rounded-full">
                      <EyeOff size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* დამატებითი ღილაკი ფოტოს დასამატებლად */}
              {mediaFiles.length < MAX_FILES && (
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    openFileDialog();
                  }}
                  className="flex items-center justify-center border-2 border-dashed border-borderGray-dark rounded-lg cursor-pointer hover:border-accent/50 transition-colors min-h-[120px] group"
                >
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-accent transition-colors">
                    <ImagePlus size={24} />
                    <span className="text-sm mt-1">დაამატე მედია</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ქვედა პანელი */}
          <div className="flex items-center justify-between pt-3 border-t border-borderGray-dark">
            {/* მედიის/ინსტრუმენტების ღილაკები */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* ფაილის არჩევის დამალული input */}
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file"
                accept="image/*,video/*"
                multiple
              />
              
              {/* მედიის დამატების ღილაკი */}
              <label 
                htmlFor="file" 
                className={`p-2 rounded-full transition-colors ${mediaFiles.length >= MAX_FILES ? 'text-gray-600 cursor-not-allowed' : 'text-accent hover:bg-secondary/50 cursor-pointer'}`}
                title={mediaFiles.length >= MAX_FILES ? `მაქსიმუმ ${MAX_FILES} ფაილი` : 'დაამატე მედია'}
                onClick={(e) => {
                  if (mediaFiles.length >= MAX_FILES) {
                    e.preventDefault();
                    setFileSelectionError(`შეგიძლიათ მაქსიმუმ ${MAX_FILES} ფაილის ატვირთვა`);
                  }
                }}
              >
                <ImageIcon size={20} />
              </label>
              
              {/* სხვა ინსტრუმენტები */}
              <button 
                type="button" 
                className="p-2 rounded-full text-gray-400 hover:text-gray-200 hover:bg-secondary/50 transition-colors"
              >
                <Smile size={20} />
              </button>
              <button 
                type="button" 
                className="p-2 rounded-full text-gray-400 hover:text-gray-200 hover:bg-secondary/50 transition-colors"
              >
                <MapPin size={20} />
              </button>
              <button 
                type="button" 
                className="p-2 rounded-full text-gray-400 hover:text-gray-200 hover:bg-secondary/50 transition-colors hidden sm:block"
              >
                <Calendar size={20} />
              </button>
              <button 
                type="button" 
                className="p-2 rounded-full text-gray-400 hover:text-gray-200 hover:bg-secondary/50 transition-colors hidden sm:block"
              >
                <BarChart2 size={20} />
              </button>
            </div>
            
            {/* გამოქვეყნების ღილაკი და სიმბოლოების მრიცხველი */}
            <div className="flex items-center gap-3">
              {/* სიმბოლოების მრიცხველი */}
              <div className={`text-sm ${charCount > MAX_CHAR_COUNT * 0.8 ? 'text-accent' : 'text-gray-500'}`}>
                {MAX_CHAR_COUNT - charCount}
              </div>
              
              <button
                type="submit"
                disabled={isPending || isUploading || (charCount === 0 && mediaFiles.length === 0)}
                className={`py-2 px-6 rounded-full font-bold transition-all duration-300 ${
                  isPending || isUploading || (charCount === 0 && mediaFiles.length === 0)
                    ? 'bg-secondary text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-accent to-accent-dark text-white hover:shadow-hover shadow-button'
                }`}
              >
                {isPending || isUploading ? (
                  <span className="flex items-center">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    {mediaFiles.length > 0 ? 'იტვირთება...' : 'ქვეყნდება...'}
                  </span>
                ) : 'გამოქვეყნება'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* მედიის რედაქტორი */}
      {isEditorOpen && currentEditIndex !== -1 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-2xl shadow-card overflow-hidden border border-borderGray-dark animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-borderGray-dark">
              <h3 className="text-xl font-bold text-textGrayLight">მედიის პარამეტრები</h3>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  closeEditor();
                }}
                className="p-2 rounded-full text-gray-400 hover:bg-secondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* პრევიუ */}
              <div className="mb-6 rounded-xl overflow-hidden border border-borderGray-dark shadow-card">
                {mediaFiles[currentEditIndex].type === 'image' ? (
                  <NextImage
                    src={mediaFiles[currentEditIndex].previewUrl}
                    alt=""
                    width={600}
                    height={600}
                    className={`w-full ${getMediaClasses(mediaFiles[currentEditIndex].settings.type)}`}
                  />
                ) : (
                  <video
                    src={mediaFiles[currentEditIndex].previewUrl}
                    controls
                    className={`w-full ${getMediaClasses(mediaFiles[currentEditIndex].settings.type)}`}
                  />
                )}
              </div>
              
              {/* პარამეტრები */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-textGrayLight font-medium mb-2">ფორმატი</h4>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const newSettings = { 
                          ...mediaFiles[currentEditIndex].settings, 
                          type: "original" as const 
                        };
                        updateFileSettings(mediaFiles[currentEditIndex].id, newSettings);
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        mediaFiles[currentEditIndex].settings.type === 'original'
                          ? 'bg-accent text-white shadow-button'
                          : 'bg-secondary text-textGrayLight hover:bg-secondary-light'
                      }`}
                    >
                      ორიგინალი
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const newSettings = { 
                          ...mediaFiles[currentEditIndex].settings, 
                          type: "square" as const 
                        };
                        updateFileSettings(mediaFiles[currentEditIndex].id, newSettings);
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        mediaFiles[currentEditIndex].settings.type === 'square'
                          ? 'bg-accent text-white shadow-button'
                          : 'bg-secondary text-textGrayLight hover:bg-secondary-light'
                      }`}
                    >
                      კვადრატი
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const newSettings = { 
                          ...mediaFiles[currentEditIndex].settings, 
                          type: "wide" as const 
                        };
                        updateFileSettings(mediaFiles[currentEditIndex].id, newSettings);
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        mediaFiles[currentEditIndex].settings.type === 'wide'
                          ? 'bg-accent text-white shadow-button'
                          : 'bg-secondary text-textGrayLight hover:bg-secondary-light'
                      }`}
                    >
                      ფართო
                    </button>
                  </div>
                </div>
                
                {/* სენსიტიურობის გადამრთველი */}
                <div>
                  <h4 className="text-textGrayLight font-medium mb-2">შემცველობა</h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const newSettings = { 
                        ...mediaFiles[currentEditIndex].settings, 
                        sensitive: !mediaFiles[currentEditIndex].settings.sensitive 
                      };
                      updateFileSettings(mediaFiles[currentEditIndex].id, newSettings);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                      mediaFiles[currentEditIndex].settings.sensitive
                        ? 'bg-accent/20 text-accent hover:bg-accent/30'
                        : 'bg-secondary text-textGrayLight hover:bg-secondary-light'
                    }`}
                  >
                    {mediaFiles[currentEditIndex].settings.sensitive ? (
                      <>
                        <EyeOff size={16} />
                        <span>სენსიტიური შემცველობა</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>ჩვეულებრივი შემცველობა</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* ყველა ფაილზე გამოყენება */}
                {mediaFiles.length > 1 && (
                  <div className="pt-2">
                    <label className="flex items-center text-textGrayLight cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="mr-2 h-5 w-5 rounded focus:ring-accent accent-accent"
                      />
                      <span>გამოიყენე ყველა ფაილზე</span>
                    </label>
                  </div>
                )}
                
                {/* დასრულების ღილაკი */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      closeEditor();
                    }}
                    className="w-full py-3 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white font-bold hover:shadow-hover transition-all duration-300 shadow-button"
                  >
                    დასრულება
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default Share;