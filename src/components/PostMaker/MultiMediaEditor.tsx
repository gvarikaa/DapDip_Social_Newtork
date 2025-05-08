import Image from "next/image";
import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

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

const MultiMediaEditor = ({
  onClose,
  mediaItems,
  setMediaItems,
  onSave,
}: {
  onClose: () => void;
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  onSave: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = mediaItems[currentIndex];

  const handleChangeSensitive = (sensitive: boolean) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === currentIndex
          ? { ...item, settings: { ...item.settings, sensitive } }
          : item
      )
    );
  };

  const handleChangeType = (type: "original" | "wide" | "square") => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === currentIndex
          ? { ...item, settings: { ...item.settings, type } }
          : item
      )
    );
  };

  const handleChangeCaption = (caption: string) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === currentIndex
          ? { ...item, settings: { ...item.settings, caption } }
          : item
      )
    );
  };

  const handleRemoveMedia = () => {
    if (mediaItems.length <= 1) {
      // თუ მხოლოდ ერთი მედია დარჩა, დახურეთ რედაქტორი
      onClose();
      return;
    }

    setMediaItems((prev) => prev.filter((_, idx) => idx !== currentIndex));
    
    // თუ ბოლო მედია წაიშალა, უკან წავიდეთ ერთით
    if (currentIndex === mediaItems.length - 1) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!currentItem) {
    return null;
  }

  return (
    <div className="fixed w-screen h-screen left-0 top-0 bg-[#151b23]/90 z-50 flex items-center justify-center">
      <div className="bg-[#1a2330] rounded-xl p-6 md:p-8 lg:p-12 flex flex-col gap-4 max-w-[90vw] max-h-[95vh] overflow-auto">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#272727]/40 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
            <h1 className="font-bold text-lg md:text-xl text-[#f1f1f1]">
              მედიის რედაქტირება ({currentIndex + 1}/{mediaItems.length})
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-[#272727] text-red-500 transition-colors"
              onClick={handleRemoveMedia}
            >
              წაშლა
            </button>
            <button 
              className="py-2 px-4 rounded-full bg-[#ff0033] text-white font-medium hover:bg-[#e5002e] transition-colors" 
              onClick={onSave}
            >
              შენახვა
            </button>
          </div>
        </div>

        {/* მედიის კონტეინერი ნავიგაციით */}
        <div className="relative w-full max-w-[600px] mx-auto">
          {/* იმიჯი/ვიდეო კონტეინერი */}
          <div className="w-full lg:w-[600px] h-[300px] md:h-[450px] lg:h-[600px] flex items-center justify-center">
            {currentItem.type === "image" ? (
              <Image
                src={currentItem.previewURL}
                alt=""
                width={600}
                height={600}
                className={`max-w-full max-h-full ${
                  currentItem.settings.type === "original"
                    ? "object-contain"
                    : currentItem.settings.type === "square"
                    ? "aspect-square object-cover"
                    : "aspect-video object-cover"
                }`}
              />
            ) : (
              <video
                src={currentItem.previewURL}
                controls
                className={`max-w-full max-h-full ${
                  currentItem.settings.type === "original"
                    ? "object-contain"
                    : currentItem.settings.type === "square"
                    ? "aspect-square object-cover"
                    : "aspect-video object-cover"
                }`}
              />
            )}
          </div>

          {/* ნავიგაციის ღილაკები */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-opacity ${
                  currentIndex === 0 ? "opacity-50 cursor-not-allowed" : "opacity-100"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === mediaItems.length - 1}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-opacity ${
                  currentIndex === mediaItems.length - 1 ? "opacity-50 cursor-not-allowed" : "opacity-100"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* წარწერის შეყვანა */}
        <div className="w-full max-w-[600px] mx-auto">
          <input
            type="text"
            placeholder="დაამატეთ წარწერა..."
            value={currentItem.settings.caption || ""}
            onChange={(e) => handleChangeCaption(e.target.value)}
            className="w-full bg-[#272727] border border-[#333] rounded-lg px-3 py-2 text-[#f1f1f1] focus:outline-none focus:border-[#ff0033]"
          />
        </div>

        {/* პარამეტრები */}
        <div className="flex flex-wrap items-center justify-between text-sm max-w-[600px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-[#272727]/40 transition-colors"
              onClick={() => handleChangeType("original")}
            >
              <svg width={24} viewBox="0 0 24 24">
                <path
                  className={
                    currentItem.settings.type === "original"
                      ? "fill-[#ff0033]"
                      : "fill-gray-400"
                  }
                  d="M3 7.5C3 6.119 4.119 5 5.5 5h13C19.881 5 21 6.119 21 7.5v9c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 19 3 17.881 3 16.5v-9zM5.5 7c-.276 0-.5.224-.5.5v9c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-9c0-.276-.224-.5-.5-.5h-13z"
                />
              </svg>
              <span className="text-[#f1f1f1]">ორიგინალი</span>
              {currentItem.settings.type === "original" && (
                <Check size={16} className="text-[#ff0033]" />
              )}
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-[#272727]/40 transition-colors"
              onClick={() => handleChangeType("wide")}
            >
              <svg width={24} viewBox="0 0 24 24">
                <path
                  className={
                    currentItem.settings.type === "wide"
                      ? "fill-[#ff0033]"
                      : "fill-gray-400"
                  }
                  d="M3 9.5C3 8.119 4.119 7 5.5 7h13C19.881 7 21 8.119 21 9.5v5c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 17 3 15.881 3 14.5v-5zM5.5 9c-.276 0-.5.224-.5.5v5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-5c0-.276-.224-.5-.5-.5h-13z"
                />
              </svg>
              <span className="text-[#f1f1f1]">ფართო</span>
              {currentItem.settings.type === "wide" && (
                <Check size={16} className="text-[#ff0033]" />
              )}
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-[#272727]/40 transition-colors"
              onClick={() => handleChangeType("square")}
            >
              <svg width={24} viewBox="0 0 24 24">
                <path
                  className={
                    currentItem.settings.type === "square"
                      ? "fill-[#ff0033]"
                      : "fill-gray-400"
                  }
                  d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v13c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-13c0-.276-.224-.5-.5-.5h-13z"
                />
              </svg>
              <span className="text-[#f1f1f1]">კვადრატული</span>
              {currentItem.settings.type === "square" && (
                <Check size={16} className="text-[#ff0033]" />
              )}
            </div>
          </div>
          <div
            className={`cursor-pointer py-1.5 px-4 rounded-full font-medium transition-colors ${
              currentItem.settings.sensitive ? "bg-red-500 text-white" : "bg-[#272727] text-gray-300 hover:bg-[#373737]"
            }`}
            onClick={() => handleChangeSensitive(!currentItem.settings.sensitive)}
          >
            {currentItem.settings.sensitive ? "სენსიტიური ✓" : "სენსიტიური"}
          </div>
        </div>

        {/* ყველა მედიის თამბნეილები */}
        {mediaItems.length > 1 && (
          <div className="mt-2 max-w-[600px] mx-auto">
            <div className="flex overflow-x-auto py-2 gap-2">
              {mediaItems.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`cursor-pointer relative min-w-[60px] h-[60px] rounded-md overflow-hidden border-2 transition-all ${
                    idx === currentIndex 
                      ? 'border-[#ff0033] scale-105' 
                      : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  {item.type === "image" ? (
                    <Image
                      src={item.previewURL}
                      alt=""
                      width={60}
                      height={60}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#272727] flex items-center justify-center">
                      <span className="text-xs text-gray-300">ვიდეო</span>
                    </div>
                  )}
                  <div className="absolute top-0.5 right-0.5 bg-black/70 rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiMediaEditor;