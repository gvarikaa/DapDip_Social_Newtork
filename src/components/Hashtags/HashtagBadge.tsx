"use client";

import React from 'react';
import Link from 'next/link';

interface HashtagBadgeProps {
  tag: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'subtle';
  onClick?: () => void;
  className?: string;
}

const HashtagBadge: React.FC<HashtagBadgeProps> = ({
  tag,
  size = 'md',
  variant = 'default',
  onClick,
  className = '',
}) => {
  // თეგის ნორმალიზება (# სიმბოლოს მოშორება თუ არსებობს)
  const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
  
  // სტილების დადგენა ზომისა და ვარიანტის მიხედვით
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const variantClasses = {
    default: 'bg-secondary hover:bg-secondary-light text-textGrayLight hover:text-white',
    accent: 'bg-accent/10 text-accent hover:bg-accent/20',
    subtle: 'bg-background-light hover:bg-background-light/80 text-textGray-light',
  };
  
  const baseClasses = 'inline-flex items-center rounded-full transition-all duration-200 font-medium';
  
  // კომპონენტის გარენდერება
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        #{normalizedTag}
      </button>
    );
  }
  
  return (
    <Link
      href={`/hashtag/${encodeURIComponent(normalizedTag)}`}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      #{normalizedTag}
    </Link>
  );
};

export default HashtagBadge;