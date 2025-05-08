"use client";

import { useState } from "react";
import Image from "./Image";
import { X, Maximize2, Eye, EyeOff } from "lucide-react";
import Video from "./Video";

// მედიის ტიპი
type Media = {
  id: number;
  type: 'image' | 'video';
  url: string;
  height?: number;
  width?: number;
  thumbnailUrl?: string;
  isSensitive: boolean;
  caption?: string;
};

type MediaGalleryProps = {
  media: Media[];
  sensitive?: boolean;
  onMediaClick?: (index: number) => void;
};

const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  media, 
  sensitive = false,
  onMediaClick
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSensitive, setShowSensitive] = useState(false);

  if (!media || media.length === 0) return null;

  const getGridClasses = () => {
    switch(media.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2"; // 2x2 გრიდი, მაგრამ პირველი სურათი იკავებს მთელ რიგს
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-3"; // 3x3 გრიდი ბევრი სურათისთვის
    }
  };

  const handleMediaClick = (index: number) => {
    if (onMediaClick) {
      onMediaClick(index);
      return;
    }
    
    // თუ სურათი სენსიტიურია და არ ვაჩვენებთ, მაშინ გავხსნათ
    if (sensitive && !showSensitive) {
      setShowSensitive(true);
      return;
    }
    
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  // მედიის გამოჩენა სენსიტიურის მდგომარეობის მიხედვით
  const isBlurred = sensitive && !showSensitive;

  // მულტიმედია ვიუვერი
  const MediaViewer = () => {
    if (!viewerOpen) return null;
    
    const currentMedia = media[currentIndex];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
        <button 
          onClick={() => setViewerOpen(false)}
          className="absolute top-4 right-4 p-2 bg-[#333] rounded-full text-white hover:bg-[#555] transition-colors z-20"
        >
          <X size={24} />
        </button>
        
        <div className="max-w-4xl max-h-screen p-4">
          {currentMedia.type === 'image' ? (
            <img 
              src={currentMedia.url.startsWith('http') ? currentMedia.url : `${process.env.NEXT_PUBLIC_URL_ENDPOINT}/${currentMedia.url}`}
              alt={currentMedia.caption || "Media"} 
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
          ) : (
            <video 
              src={currentMedia.url.startsWith('http') ? currentMedia.url : `${process.env.NEXT_PUBLIC_URL_ENDPOINT}/${currentMedia.url}`}
              controls
              className="max-h-[80vh] max-w-full rounded-lg"
            />
          )}
          
          {currentMedia.caption && (
            <p className="mt-2 text-white text-center">{currentMedia.caption}</p>
          )}
          
          {media.length > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              {media.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full ${currentIndex === idx ? 'bg-white' : 'bg-gray-500'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`grid ${getGridClasses()} gap-1 rounded-xl overflow-hidden relative`}>
        {/* სენსიტიური კონტენტის ოვერლეი */}
        {sensitive && !showSensitive && (
          <div 
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a1a] bg-opacity-90 backdrop-blur-md"
            style={{
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            <EyeOff size={36} className="text-gray-300 mb-3" />
            <p className="text-gray-200 font-medium mb-2">სენსიტიური კონტენტი</p>
            <p className="text-gray-400 text-sm mb-4 px-6 text-center">
              ეს კონტენტი შეიძლება შეიცავდეს სენსიტიურ მასალას
            </p>
            <button 
              onClick={() => setShowSensitive(true)}
              className="px-4 py-2 bg-[#ff0033] text-white rounded-full font-medium hover:bg-[#cc0033] transition-colors"
            >
              გამოჩენა
            </button>
          </div>
        )}
        
        {/* მედია ელემენტები */}
        {media.map((item, index) => (
          <div 
            key={item.id || index} 
            className={`relative overflow-hidden cursor-pointer transition-all duration-300
              ${media.length === 3 && index === 0 ? "col-span-2" : ""}
              ${media.length > 4 && index >= 4 ? "hidden md:block" : ""}
              ${isBlurred ? "blur-xl" : ""}
            `}
            onClick={() => handleMediaClick(index)}
          >
            {item.type === 'image' ? (
              <div className="aspect-square w-full h-full">
                <Image
                  path={item.url}
                  alt={item.caption || ""}
                  w={600}
                  h={item.height || 600}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-video w-full h-full">
                <Video
                  path={item.url}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Zoom ღილაკი */}
            <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity group">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMediaClick(index);
                }}
                className="p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
              >
                <Maximize2 size={16} className="text-white" />
              </button>
            </div>
            
            {/* ბეჯი ბევრი ფოტოსთვის */}
            {media.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{media.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* ფოტოს ვიუვერი */}
      <MediaViewer />
    </>
  );
};

export default MediaGallery;