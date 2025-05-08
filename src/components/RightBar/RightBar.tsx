"use client";

import React from 'react';
import { Search, X } from 'lucide-react';
import { TrendingHashtags } from '../Hashtags';
import RecommendationsWidget from '../Recommendations/RecommendationsWidget';
import Image from 'next/image';

const RightBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  return (
    <div className="h-screen sticky top-0 w-full max-w-[320px] pl-5 pt-2 pb-8 hidden lg:block">
      <div className="flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar pr-3">
        {/* ძებნის კონტეინერი */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textGray">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="ძებნა"
            className="bg-secondary/50 text-white rounded-full py-2.5 pl-10 pr-10 w-full focus:outline-none focus:ring-1 focus:ring-accent/50 focus:bg-secondary transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textGray hover:text-white"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* პრემიუმი */}
        <div className="bg-secondary rounded-xl p-4 shadow-card">
          <h2 className="font-bold text-lg mb-2">გაიცანით DapDip Premium</h2>
          <p className="text-textGray-light text-sm mb-3">
            აღმოაჩინეთ მეტი შესაძლებლობა და გახდით DapDip საზოგადოების ნაწილი.
          </p>
          <button className="bg-accent hover:bg-accent-dark text-white rounded-full py-2 px-4 font-medium transition-all duration-200 shadow-button">
            გამოიწერეთ
          </button>
        </div>
        
        {/* ტრენდული ჰეშთეგები */}
        <div className="bg-secondary rounded-xl p-4 shadow-card">
          <TrendingHashtags limit={5} />
        </div>
        
        {/* რეკომენდაციები */}
        <div className="bg-secondary rounded-xl p-4 shadow-card">
          <RecommendationsWidget />
        </div>
        
        {/* ფუტერი */}
        <div className="text-textGray text-xs p-1">
          <div className="flex flex-wrap gap-2 mb-3">
            <a href="#" className="hover:underline hover:text-textGray-light transition-colors duration-200">წესები</a>
            <a href="#" className="hover:underline hover:text-textGray-light transition-colors duration-200">კონფიდენციალურობა</a>
            <a href="#" className="hover:underline hover:text-textGray-light transition-colors duration-200">რეკლამა</a>
            <a href="#" className="hover:underline hover:text-textGray-light transition-colors duration-200">სერვისები</a>
            <a href="#" className="hover:underline hover:text-textGray-light transition-colors duration-200">ჩვენს შესახებ</a>
          </div>
          <p>© 2025 DapDip Inc.</p>
          <div className="mt-4 flex justify-start">
            <div className="group relative">
              <Image 
                src="/images/icons/logo.svg" 
                alt="DapDip" 
                width={20} 
                height={20} 
                className="opacity-50 group-hover:opacity-100 transition-opacity duration-200"
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightBar;