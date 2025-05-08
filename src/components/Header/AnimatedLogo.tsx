"use client";

import React, { useState, useEffect } from 'react';

const AnimatedLogo: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // რანდომული ანიმაცია hover-ზე
  const triggerAnimation = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);
    }
  };

  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={triggerAnimation}
      onClick={triggerAnimation}
    >
      <div className="relative">
        <svg 
          width="36" 
          height="36" 
          viewBox="0 0 36 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={`${isAnimating ? 'animate-pulse' : ''} transition-all duration-300`}
        >
          <path 
            d="M18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0ZM18 32.4C10.044 32.4 3.6 25.956 3.6 18C3.6 10.044 10.044 3.6 18 3.6C25.956 3.6 32.4 10.044 32.4 18C32.4 25.956 25.956 32.4 18 32.4Z" 
            fill="#FF0033"
          />
          <path 
            d="M22.5 13.5L18 22.5L13.5 13.5H22.5Z" 
            fill="#FF0033"
            className={`${isAnimating ? 'animate-spin' : ''} transition-all duration-300`}
          />
        </svg>
        
        {/* ანიმაციის ეფექტები */}
        {isAnimating && (
          <>
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse"></div>
          </>
        )}
      </div>
      
      <span className="ml-2 font-bold text-lg bg-gradient-to-r from-accent to-accent-light text-transparent bg-clip-text">
        DapDip
      </span>
    </div>
  );
};

export default AnimatedLogo;