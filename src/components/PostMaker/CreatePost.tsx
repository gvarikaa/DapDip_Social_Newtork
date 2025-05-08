import React, { useRef, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Video, Camera } from "lucide-react";
import MultiMediaEditor from "./MultiMediaEditor";
import ProfileAvatar from "../Avatar/ProfileAvatar";

type MediaItem = {
  id: string;
  file: File;
  previewURL: string;
  type: "image" | "video";
  settings: {
    type: "original" | "wide" | "square";
    sensitive: boolean;
    caption?: string;
  };
};

const CreatePost = ({ user }: { user: any }) => {
  const [postText, setPostText] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  // ტექსტის სიმაღლის ავტომატური მორგება
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // ფაილის არჩევის დიალოგის გახსნა ორი ვარიანტით
  const openFileDialog = () => {
    // პირველ რიგში დავრწმუნდეთ, რომ fileInputRef არსებობს
    if (fileInputRef.current) {
      console.log("ფაილის არჩევის დიალოგი იხსნება...");
      fileInputRef.current.click();
    } else {
      console.log("ფაილის არჩევის ელემენტი ვერ მოიძებნა!");
    }
  };

  // ფაილების არჩევა ძირითადი ფუნქცია
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    console.log("handleFileSelect გამოძახებულია");
    console.log("არჩეული ფაილები:", e.target.files);
    console.log("ფაილების რაოდენობა:", e.target.files?.length || 0);
    
    if (!e.target.files || e.target.files.length === 0) {
      console.log("ფაილები არ არის არჩეული");
      return;
    }
    
    const selectedFiles = Array.from(e.target.files);
    console.log("არჩეული ფაილების მასივი:", selectedFiles.map(f => f.name));

    try {
      const newMediaItems: MediaItem[] = selectedFiles.map(file => {
        const id = Math.random().toString(36).substring(2, 9);
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const previewURL = URL.createObjectURL(file);
        
        return {
          id,
          file,
          previewURL,
          type,
          settings: {
            type: 'original',
            sensitive: false
          }
        };
      });
      
      console.log(`შექმნილია ${newMediaItems.length} მედია აიტემი`);
      
      setMediaItems(prev => {
        const updatedItems = [...prev, ...newMediaItems];
        console.log(`ახალი მედია აიტემების რაოდენობა: ${updatedItems.length}`);
        return updatedItems;
      });
      
      // შევამოწმოთ, რომ არაა ძალიან ბევრი მედია
      if ([...mediaItems, ...newMediaItems].length > 10) {
        setError("10-ზე მეტი მედიის დამატება არ შეიძლება");
        // წავშალოთ ზედმეტი მედია
        setMediaItems(prev => prev.slice(0, 10));
      } else {
        setShowEditor(true);
      }
    } catch (error) {
      console.error("შეცდომა მედიის დამუშავებისას:", error);
      setError("მედიის დამუშავება ვერ მოხერხდა");
    }
    
    // ფორმის reset
    e.target.value = "";
  };

  // ალტერნატიული მიდგომა: გამოიყენეთ ხილული ფაილის არჩევის input
  const [showFileInput, setShowFileInput] = useState(false);

  // ყველა მედიის წაშლა
  const handleClearMedia = () => {
    setMediaItems([]);
    setShowEditor(false);
  };

  // პოსტის გაგზავნა
  const handleSubmitPost = async () => {
    if (!postText.trim() && mediaItems.length === 0) {
      setError("დაამატეთ ტექსტი ან მედია პოსტისთვის");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. ჯერ შევქმნათ პოსტი
      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          desc: postText,
          isSensitive: mediaItems.some(item => item.settings.sensitive),
        }),
      });

      if (!postResponse.ok) {
        throw new Error('პოსტის შექმნა ვერ მოხერხდა');
      }

      const postData = await postResponse.json();
      const postId = postData.id;

      // 2. თუ გვაქვს მედია, ავტვირთოთ
      if (mediaItems.length > 0) {
        const formData = new FormData();
        formData.append('postId', postId.toString());
        
        // კაპშენების მომზადება
        const captions: Record<string, string> = {};
        
        mediaItems.forEach(media => {
          formData.append('files', media.file);
          if (media.settings.caption) {
            captions[media.file.name] = media.settings.caption;
          }
        });
        
        // კაპშენები
        formData.append('captions', JSON.stringify(captions));
        
        // მედიის პარამეტრები (type, sensitive)
        const mediaSettings = mediaItems.map(media => ({
          fileName: media.file.name,
          type: media.settings.type,
          sensitive: media.settings.sensitive
        }));
        
        formData.append('mediaSettings', JSON.stringify(mediaSettings));
        
        const mediaResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!mediaResponse.ok) {
          throw new Error('მედიის ატვირთვა ვერ მოხერხდა');
        }
      }

      // წარმატების შემთხვევაში, გავასუფთაოთ ფორმა
      setPostText("");
      setMediaItems([]);
      setShowEditor(false);
      
      // აქ შეგიძლიათ დაამატოთ navigation ან სხვა მოქმედება პოსტის წარმატებით შექმნის შემდეგ
      // მაგალითად:
      // router.push(`/${user.username}/status/${postId}`);
      // ან
      // router.refresh();

    } catch (err) {
      console.error('პოსტის შექმნისას შეცდომა:', err);
      setError('პოსტის შექმნა ვერ მოხერხდა. გთხოვთ, სცადოთ მოგვიანებით.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#151b23] rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex gap-3">
        {/* მომხმარებლის ავატარი */}
        <div className="w-11 h-11 rounded-full overflow-hidden shadow-sm">
          <ProfileAvatar
            imageUrl={user.img}
            username={user.username}
            gender={user.gender}
            avatarProps={user.avatarProps}
            size="sm"
          />
        </div>

        {/* პოსტის შემცველობა */}
        <div className="flex-1 space-y-3">
          {/* ტექსტის შეყვანა */}
          <textarea
            ref={textareaRef}
            value={postText}
            onChange={handleTextChange}
            placeholder="რას ფიქრობთ?"
            className="w-full bg-transparent text-[#f1f1f1] text-lg resize-none outline-none min-h-[60px] max-h-[300px] placeholder:text-gray-500"
            rows={1}
          />

          {/* მედიის პრევიუ */}
          {mediaItems.length > 0 && !showEditor && (
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaItems.slice(0, 6).map((item, index) => (
                  <div 
                    key={item.id} 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-[#1a2330]"
                    onClick={() => setShowEditor(true)}
                  >
                    {item.type === 'image' ? (
                      <img 
                        src={item.previewURL} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="text-gray-400" size={36} />
                      </div>
                    )}
                    
                    {index === 5 && mediaItems.length > 6 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">+{mediaItems.length - 6}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button 
                onClick={handleClearMedia}
                className="absolute top-2 right-2 p-1.5 bg-[#151b23]/70 rounded-full hover:bg-[#151b23]/90 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
              
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {mediaItems.length} {mediaItems.length === 1 ? 'მედია' : 'მედია'} არჩეულია
                </span>
                <button 
                  onClick={() => setShowEditor(true)}
                  className="text-sm text-[#ff0033] hover:underline"
                >
                  რედაქტირება
                </button>
              </div>
            </div>
          )}

          {/* დროებითი ხილული ფაილის არჩევის ინსტრუმენტი */}
          {showFileInput && (
            <div className="mb-2 p-2 rounded bg-[#272727]">
              <p className="text-sm text-gray-300 mb-1">აირჩიეთ რამდენიმე ფაილი Ctrl/Cmd ღილაკით:</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="text-sm text-gray-300"
              />
            </div>
          )}

          {/* შეცდომის შეტყობინება */}
          {error && (
            <div className="bg-red-500/10 text-red-500 p-2 rounded-lg text-sm flex items-center gap-2">
              <X size={16} />
              {error}
            </div>
          )}

          {/* ქმედებების პანელი */}
          <div className="flex justify-between items-center pt-2 border-t border-[#272727]">
            <div className="flex items-center gap-2">
              <button
                onClick={openFileDialog}
                className="p-2 rounded-full text-[#ff0033] hover:bg-[#ff0033]/10 transition-colors"
                title="აირჩიეთ ფოტო ან ვიდეო"
              >
                <Camera size={20} />
              </button>

              {/* ფაილის არჩევის დამალული input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* დამატებითი ღილაკი ხილული ინსტრუმენტის გასაჩენად */}
              <button
                onClick={() => setShowFileInput(!showFileInput)}
                className="p-2 rounded-full text-gray-400 hover:text-[#f1f1f1] transition-colors"
                title={showFileInput ? "დამალე ფაილის არჩევა" : "ალტერნატიული მეთოდი"}
              >
                <Upload size={18} />
              </button>
            </div>
            
            <button
              onClick={handleSubmitPost}
              disabled={isSubmitting || (postText.trim() === '' && mediaItems.length === 0)}
              className={`px-5 py-2 rounded-full flex items-center gap-2 transition-colors ${
                isSubmitting || (postText.trim() === '' && mediaItems.length === 0)
                  ? 'bg-[#272727] text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff0033] text-white hover:bg-[#e5002e]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  მიმდინარეობს...
                </>
              ) : (
                "დაპოსტვა"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* მედიის რედაქტორი */}
      {showEditor && (
        <MultiMediaEditor
          onClose={() => setShowEditor(false)}
          mediaItems={mediaItems}
          setMediaItems={setMediaItems}
          onSave={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default CreatePost;