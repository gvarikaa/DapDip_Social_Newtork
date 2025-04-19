"use client";

import { useState } from "react";
import FriendsList from "@/components/Chat/FriendsList";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  
  return (
    <div className="h-screen flex relative">
      {/* მობილური ვერსიის მეგობრების სია (ჰამბურგერი მენიუ) */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} transform transition-transform duration-300 ease-in-out fixed inset-0 z-40 lg:hidden`}>
        <div className="relative h-full w-3/4 bg-black shadow-xl">
          <button 
            className="absolute top-4 right-4 p-2 text-white"
            onClick={() => setShowSidebar(false)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <FriendsList />
        </div>
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setShowSidebar(false)}
        ></div>
      </div>
      
      {/* ძირითადი ლეიაუტი */}
      <div className="flex-1 relative">
        {/* ჰამბურგერი ღილაკი მობილურ ვერსიაზე */}
        <button 
          className="fixed top-4 left-4 p-2 bg-gray-800 rounded-md z-30 lg:hidden"
          onClick={() => setShowSidebar(true)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        {children}
      </div>
    </div>
  );
}