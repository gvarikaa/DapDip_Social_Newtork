"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, MessageSquare, Bell, Bookmark, Briefcase, Users, Award, User, MoreHorizontal, PlusCircle } from 'lucide-react';
import NotificationWrapper from './NotificationWrapper';
import { useSupabase } from '@/hooks/useSupabase';

interface MenuItem {
  id: number;
  name: string;
  link: string;
  icon: React.ReactNode;
  notification?: boolean;
}

const LeftBar: React.FC = () => {
  const { user, profile } = useSupabase();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // მენიუს ელემენტები
  const menuList: MenuItem[] = [
    {
      id: 1,
      name: "მთავარი",
      link: "/",
      icon: <Home className="w-6 h-6" />,
    },
    {
      id: 2,
      name: "ექსპლორი",
      link: "/explore",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>,
    },
    {
      id: 3,
      name: "შეტყობინებები",
      link: "/notifications",
      icon: <Bell className="w-6 h-6" />,
      notification: true,
    },
    {
      id: 4,
      name: "მესიჯები",
      link: "/messages",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      id: 5,
      name: "სანიშნები",
      link: "/bookmarks",
      icon: <Bookmark className="w-6 h-6" />,
    },
    {
      id: 6,
      name: "ვაკანსიები",
      link: "/jobs",
      icon: <Briefcase className="w-6 h-6" />,
    },
    {
      id: 7,
      name: "ჯგუფები",
      link: "/groups",
      icon: <Users className="w-6 h-6" />,
    },
    {
      id: 8,
      name: "პრემიუმი",
      link: "/premium",
      icon: <Award className="w-6 h-6" />,
    },
    {
      id: 9,
      name: "პროფილი",
      link: "/profile",
      icon: <User className="w-6 h-6" />,
    },
    {
      id: 10,
      name: "სხვა",
      link: "/more",
      icon: <MoreHorizontal className="w-6 h-6" />,
    },
  ];

  // აქტიურია თუ არა მოცემული გვერდი
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen sticky top-0 flex flex-col justify-between pt-2 pb-8 overflow-hidden transition-all duration-300">
      {/* ლოგო */}
      <div className="flex flex-col gap-4 text-lg">
        <Link 
          href="/" 
          className="p-2 rounded-full hover:bg-secondary/50 transition-all duration-200 flex items-center"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <div className="flex items-center">
            <Image 
              src="/images/icons/logo.svg" 
              alt="DapDip" 
              width={28} 
              height={28} 
              className="text-accent"
            />
            <span className={`ml-3 font-bold text-white overflow-hidden transition-all duration-300 ${isExpanded ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}>
              DapDip
            </span>
          </div>
        </Link>

        {/* მენიუს სია */}
        <div className="flex flex-col gap-1 mt-3">
          {menuList.map((item) => (
            <div key={item.id} className="relative">
              {item.notification && <NotificationWrapper />}
              <Link
                href={item.link}
                className={`p-3 rounded-full flex items-center gap-3 transition-all duration-200 hover:bg-secondary/50 ${
                  isActive(item.link) 
                    ? 'font-bold text-accent' 
                    : 'text-textGray-light hover:text-white'
                }`}
              >
                <span className="min-w-[24px]">{item.icon}</span>
                <span className="hidden xxl:inline">{item.name}</span>
              </Link>
            </div>
          ))}
        </div>

        {/* პოსტის ღილაკი */}
        <Link
          href="/compose/post"
          className="mt-4 bg-accent hover:bg-accent-dark text-white rounded-full w-12 h-12 xxl:w-auto xxl:px-5 xxl:py-3 flex items-center justify-center transition-all duration-200 shadow-button"
        >
          <PlusCircle className="w-6 h-6 xxl:mr-2" />
          <span className="hidden xxl:inline font-bold">პოსტი</span>
        </Link>
      </div>

      {/* მომხმარებლის პროფილი */}
      {user && (
        <div className="flex items-center justify-between bg-secondary/20 p-2 rounded-full xxl:pr-4 hover:bg-secondary/50 transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 relative rounded-full overflow-hidden border-2 border-borderGray-dark">
              <Image
                src={profile?.img || "/images/general/avatar.png"}
                alt={profile?.name || "მომხმარებელი"}
                width={100}
                height={100}
                className="object-cover"
              />
            </div>
            <div className="hidden xxl:flex flex-col">
              <span className="font-bold text-white">{profile?.name || "მომხმარებელი"}</span>
              <span className="text-xs text-textGray">@{profile?.username || user.email?.split('@')[0]}</span>
            </div>
          </div>
          <button className="p-1 rounded-full hover:bg-secondary transition-colors duration-200 hidden xxl:block">
            <MoreHorizontal className="w-5 h-5 text-textGray-light" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LeftBar;