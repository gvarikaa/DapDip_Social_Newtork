// src/components/Reels/ReelsUpload.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Video, Image as ImageIcon, Tag, Sparkles, Check, AlertTriangle, Info, ChevronDown, ChevronUp, Clock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReelCategory } from "@prisma/client";
import Image from "next/image";

// დავამატოთ პროპების ტიპი
interface ReelsUploadProps {
  categories: ReelCategory[]; // ახლა სწორად არის განსაზღვრული ტიპი
}

const ReelsUpload = ({ categories = [] }: ReelsUploadProps) => {
  const router = useRouter();
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [category, setCategory] = useState("");
  const [isSensitive, setIsSensitive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoInfo, setVideoInfo] = useState<{width: number, height: number} | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // ვიდეოს ატვირთვის ფუნქცია - გაუმჯობესებული
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // შევამოწმოთ ფაილის ტიპი
    if (!file.type.startsWith('video/')) {
      setError("გთხოვთ, აირჩიოთ ვიდეო ფაილი");
      return;
    }
    
    // შევამოწმოთ ფაილის ზომა (მაქსიმუმ 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("ვიდეო ზომა არ უნდა აღემატებოდეს 100MB-ს");
      return;
    }
    
    setVideoFile(file);
    setError(null);
    
    // შევქმნათ პრევიუ და ვიდეოს დეტალები
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    
    // ვიდეოს ხანგრძლივობის და ზომის მიღება
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      setVideoInfo({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };
    video.src = url;
  };
  
  // თამბნეილის ატვირთვის ფუნქცია
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // შევამოწმოთ ფაილის ტიპი
    if (!file.type.startsWith('image/')) {
      setError("გთხოვთ, აირჩიოთ სურათის ფაილი თამბნეილისთვის");
      return;
    }
    
    // შევამოწმოთ ფაილის ზომა (მაქსიმუმ 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("თამბნეილის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }
    
    setThumbnailFile(file);
    setError(null);
    
    // შევქმნათ პრევიუ
    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
  };
  
  // თამბნეილის ავტომატური შექმნა ვიდეოდან
  const generateThumbnail = () => {
    if (!videoRef.current || !videoPreview) return;
    
    const video = videoRef.current;
    
    // ვიდეოს შუა ნაწილში განვათავსოთ playhead
    video.currentTime = video.duration / 2;
    
    // ვიდეოს პოზიციის განახლების შემდეგ დავაგენერიროთ თამბნეილი
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // კანვასიდან ბლობის მიღება
        canvas.toBlob((blob) => {
          if (blob) {
            // ბლობიდან ფაილის შექმნა
            const thumbnailFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
            setThumbnailFile(thumbnailFile);
            
            // URL-ის შექმნა პრევიუსთვის
            const url = URL.createObjectURL(blob);
            setThumbnailPreview(url);
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error("თამბნეილის გენერირების შეცდომა:", err);
        setError("თამბნეილის გენერირება ვერ მოხერხდა");
      }
    };
  };
  
  // ჰეშთეგის დამატების ფუნქცია
  const addHashtag = () => {
    if (!hashtagInput.trim()) return;
    
    // წაშალეთ # თუ არის ჰეშთეგის დასაწყისში
    const tag = hashtagInput.trim().replace(/^#/, '');
    
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    
    setHashtagInput("");
  };
  
  // ჰეშთეგის წაშლის ფუნქცია
  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };
  
  // ხანგრძლივობის ფორმატირება
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ატვირთვის ფუნქცია - გაუმჯობესებული და რესპონსიული
  const handleUpload = async () => {
    if (!videoFile) {
      setError("გთხოვთ, აირჩიოთ ვიდეო");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (category) formData.append('categoryId', category);
      
      // ვიდეოს მეტა-ინფორმაცია თუ გვაქვს
      if (videoDuration) {
        formData.append('duration', videoDuration.toString());
      }
      
      if (videoInfo) {
        formData.append('width', videoInfo.width.toString());
        formData.append('height', videoInfo.height.toString());
      }
      
      // ჰეშთეგები JSON სტრინგად
      if (hashtags.length > 0) {
        formData.append('hashtags', JSON.stringify(hashtags));
      }
      
      formData.append('isSensitive', isSensitive.toString());
      
      // ატვირთვის პროგრესის სიმულაცია - უფრო რეალისტური
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // დასაწყისში ნელა
          if (prev < 30) {
            return prev + Math.floor(Math.random() * 3) + 1;
          }
          // შუაში საშუალო სიჩქარით
          else if (prev < 70) {
            return prev + Math.floor(Math.random() * 5) + 2;
          }
          // ბოლოში ძალიან ნელა
          else if (prev < 95) {
            return prev + Math.floor(Math.random() * 2) + 1;
          }
          
          clearInterval(progressInterval);
          return 95; // ვჩერდებით 95%-ზე დასამუშავებლად
        });
      }, 300);
      
      // გამოვიძახოთ API
      const response = await fetch('/api/reels', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ატვირთვისას შეცდომა მოხდა");
      }
      
      const data = await response.json();
      
      // წარმატებით ატვირთვა - მივცეთ მომხმარებელს დრო დაინახოს 100%
      setTimeout(() => {
        // ვაჩვენოთ წარმატების შეტყობინება
        setError(null);
        
        // გადავამისამართოთ ატვირთული რილსის გვერდზე
        router.push(`/reels/${data.reel.id}`);
      }, 1000);
    } catch (err) {
      console.error("ატვირთვის შეცდომა:", err);
      setError((err as Error).message || "ატვირთვისას შეცდომა მოხდა");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 pb-24 h-auto">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full text-gray-400 hover:bg-secondary hover:text-white transition-colors mr-2"
          aria-label="უკან დაბრუნება"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">ახალი რილსის ატვირთვა</h1>
      </div>
      
      {/* ვიდეოს ატვირთვის არეა */}
      <div className="mb-6">
        <label className="block text-lg text-white font-medium mb-2">
          აირჩიეთ ვიდეო <span className="text-accent">*</span>
        </label>
        
        {!videoFile ? (
          <div 
            onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-borderGray-dark rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
          >
            <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-300 mb-2">დააკლიკეთ ვიდეოს ასარჩევად</p>
            <p className="text-gray-500 text-sm">MP4, MOV, WEBM | მაქს. 100MB</p>
            
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept="video/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-secondary border border-borderGray-dark">
            <video 
              ref={videoRef}
              src={videoPreview || undefined}
              className="w-full h-[300px] object-contain"
              controls
            />
            
            <button
              onClick={() => {
                setVideoFile(null);
                setVideoPreview(null);
                setVideoDuration(null);
                setVideoInfo(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black transition-colors"
            >
              <X size={20} />
            </button>
            
            {/* ვიდეოს ინფორმაცია */}
            {(videoDuration || videoInfo) && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 backdrop-blur-sm flex items-center justify-between text-xs text-white">
                {videoDuration && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatDuration(videoDuration)}</span>
                  </div>
                )}
                {videoInfo && (
                  <div className="flex items-center gap-1">
                    <span>{videoInfo.width}x{videoInfo.height}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* ვიდეოს ინფორმაცია მობილურ მოწყობილობებზე */}
        {videoFile && (videoDuration || videoInfo) && (
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-400 md:hidden">
            {videoDuration && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{formatDuration(videoDuration)}</span>
              </div>
            )}
            {videoInfo && (
              <div className="flex items-center gap-1">
                <span>{videoInfo.width}x{videoInfo.height}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* თამბნეილის ატვირთვის არეა */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg text-white font-medium">
            თამბნეილი
          </label>
          
          {videoPreview && !thumbnailPreview && (
            <button
              onClick={generateThumbnail}
              className="text-accent text-sm hover:underline flex items-center gap-1"
            >
              <Sparkles size={14} />
              <span>გენერირება ვიდეოდან</span>
            </button>
          )}
        </div>
        
        {!thumbnailFile ? (
          <div 
            onClick={() => thumbnailInputRef.current?.click()}
            className="border-2 border-dashed border-borderGray-dark rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors"
          >
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-300 text-sm">აირჩიეთ სურათი თამბნეილისთვის</p>
            <p className="text-gray-500 text-xs mt-1">ან დააგენერირეთ ვიდეოდან</p>
            
            <input
              type="file"
              ref={thumbnailInputRef}
              onChange={handleThumbnailSelect}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden h-32 bg-secondary border border-borderGray-dark">
            {thumbnailPreview && (
              <img 
                src={thumbnailPreview}
                alt="Thumbnail"
                className="w-full h-full object-contain"
              />
            )}
            
            <button
              onClick={() => {
                setThumbnailFile(null);
                setThumbnailPreview(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* დეტალები */}
      <div className="space-y-4 mb-6">
        {/* სათაური */}
        <div>
          <label htmlFor="title" className="block text-white font-medium mb-1">
            სათაური
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2 bg-secondary border border-borderGray-dark rounded-lg text-white focus:outline-none focus:border-accent"
            placeholder="სათაური..."
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{title.length}/100</span>
          </div>
        </div>
        
        {/* აღწერა */}
        <div>
          <label htmlFor="description" className="block text-white font-medium mb-1">
            აღწერა
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2 bg-secondary border border-borderGray-dark rounded-lg text-white focus:outline-none focus:border-accent resize-none"
            placeholder="აღწერა..."
          />
          {/* სიმბოლოების მთვლელი */}
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{description.length}/500</span>
          </div>
        </div>
        
        {/* ჰეშთეგები */}
        <div>
          <label htmlFor="hashtags" className="block text-white font-medium mb-1">
            ჰეშთეგები
          </label>
          
          <div className="flex items-center mb-2">
            <input
              type="text"
              id="hashtags"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addHashtag();
                }
              }}
              className="flex-1 px-4 py-2 bg-secondary border border-borderGray-dark rounded-l-lg text-white focus:outline-none focus:border-accent"
              placeholder="დაამატეთ ჰეშთეგი..."
            />
            <button
              type="button"
              onClick={addHashtag}
              className="px-4 py-2 bg-accent text-white rounded-r-lg hover:bg-accent-dark transition-colors"
            >
              <Tag size={18} />
            </button>
          </div>
          
          {/* ჰეშთეგების ჩიპები */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map((tag) => (
                <div 
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary-dark rounded-full text-white text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    className="text-gray-400 hover:text-white ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* მნიშვნელოვანი ველები */}
        <div>
          <label htmlFor="category" className="block text-white font-medium mb-1">
            კატეგორია
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-secondary border border-borderGray-dark rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="">აირჩიეთ კატეგორია...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* გაფართოებული ოპციები */}
        <div>
          <button
            type="button"
            onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
            className="flex items-center gap-2 text-white font-medium"
          >
            {isAdvancedOptionsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            <span>დამატებითი პარამეტრები</span>
          </button>
          
          {isAdvancedOptionsOpen && (
            <div className="mt-2 space-y-3 pl-2 border-l-2 border-secondary">
              {/* სენსიტიური კონტენტი */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sensitive"
                  checked={isSensitive}
                  onChange={(e) => setIsSensitive(e.target.checked)}
                  className="w-5 h-5 bg-secondary border-borderGray-dark accent-accent"
                />
                <label htmlFor="sensitive" className="ml-2 text-white flex items-center gap-1">
                  <span>შეიცავს სენსიტიურ კონტენტს</span>
                  <div className="group relative">
                    <Info size={14} className="text-gray-400 cursor-help" />
                    <div className="absolute left-full ml-2 w-48 p-2 bg-secondary-dark rounded-md text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      მონიშნეთ, თუ ვიდეო შეიცავს არასათანადო ან სენსიტიურ მასალას
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* შეცდომის შეტყობინება */}
      {error && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2 text-accent">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      
      {/* ატვირთვის პროგრესი */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-sm">იტვირთება...</span>
            <span className="text-white text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          {uploadProgress >= 95 && (
            <p className="text-center text-gray-400 text-sm mt-2">
              დამუშავება... გთხოვთ, დაელოდოთ.
            </p>
          )}
        </div>
      )}
      
      {/* ღილაკები */}
      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-borderGray-dark rounded-lg text-white hover:bg-secondary transition-colors"
        >
          გაუქმება
        </button>
        
        <button
          type="button"
          onClick={handleUpload}
          disabled={!videoFile || isUploading}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
            !videoFile || isUploading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent-dark cursor-pointer'
          } transition-colors`}
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>იტვირთება...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>ატვირთვა</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReelsUpload;