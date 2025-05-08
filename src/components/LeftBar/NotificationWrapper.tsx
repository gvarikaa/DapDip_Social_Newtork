"use client";

import React from 'react';

const NotificationWrapper: React.FC = () => {
  return (
    <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
      3
    </div>
  );
};

export default NotificationWrapper;