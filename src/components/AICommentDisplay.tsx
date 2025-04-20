"use client";

import { format } from "timeago.js";
import Image from "./CustomImage";
import { useEffect, useState } from "react";

type AICommentDisplayProps = {
  content: string;
  createdAt: string;
};

const AICommentDisplay = ({ content, createdAt }: AICommentDisplayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // ეფექტი შესვლისას
    setIsVisible(true);
  }, []);

  return (
    <div 
      className={`p-3 bg-gradient-to-r from-[#1A1E23] to-[#1e2530] rounded-lg border border-blue-900 border-opacity-30 shadow-lg transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            fill="currentColor"
            viewBox="0 0 16 16"
            className="text-white"
          >
            <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Z"/>
            <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866Z"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-blue-400">ChatGPT</span>
          <span className="text-xs text-textGray">{format(createdAt)}</span>
        </div>
      </div>
      <div className="pl-10 mt-2">
        <p className="text-sm text-white leading-relaxed">{content}</p>
        <div className="mt-3 text-xs text-blue-300 italic">
          ეს არის AI-ის მიერ გენერირებული შინაარსი და შეიძლება არ ასახავდეს ზუსტ ფაქტებს.
        </div>
      </div>
    </div>
  );
};

export default AICommentDisplay;