"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  username: string;
  img?: string;
  bio?: string;
}

interface UserSuggestionProps {
  user: User;
}

const UserSuggestion: React.FC<UserSuggestionProps> = ({ user }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // ნამდვილი API მოთხოვნა
      // const response = await fetch(`/api/users/${user.id}/follow`, {
      //   method: isFollowing ? 'DELETE' : 'POST',
      //   credentials: 'include'
      // });
      
      // if (!response.ok) throw new Error('გამოწერის შეცდომა');
      
      // გამოწერის დაყენება
      setTimeout(() => {
        setIsFollowing(!isFollowing);
        setIsLoading(false);
      }, 300);
    } catch (error) {
      console.error("Failed to follow/unfollow:", error);
      setIsLoading(false);
    }
  };

  return (
    <Link 
      href={`/${user.username}`} 
      className="flex items-center justify-between gap-3 hover:bg-secondary/50 p-2 -mx-2 rounded-lg transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 relative rounded-full overflow-hidden">
          <Image
            src={user.img || "/images/general/avatar.png"}
            alt={user.name}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-white line-clamp-1">{user.name}</span>
          <span className="text-textGray text-xs">@{user.username}</span>
        </div>
      </div>
      
      <button
        onClick={handleFollow}
        className={`min-w-[84px] px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          isFollowing
            ? 'border border-borderGray text-white hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 group'
            : 'bg-white text-black hover:bg-opacity-90'
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-t-transparent border-r-accent border-b-accent border-l-accent rounded-full animate-spin"></span>
        ) : isFollowing ? (
          <>
            <span className="group-hover:hidden flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              <span>გამოწერილი</span>
            </span>
            <span className="hidden group-hover:block">გაუქმება</span>
          </>
        ) : (
          "გამოწერა"
        )}
      </button>
    </Link>
  );
};

export default UserSuggestion;