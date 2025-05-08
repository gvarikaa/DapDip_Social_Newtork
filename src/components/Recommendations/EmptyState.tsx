"use client";

import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  actionLink?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = "მონაცემები არ მოიძებნა",
  actionLabel,
  actionLink
}) => {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      <div className="bg-secondary/50 p-4 rounded-full mb-3">
        <SearchX className="w-8 h-8 text-textGray" />
      </div>
      <p className="text-textGray-light mb-3">{message}</p>
      
      {actionLabel && actionLink && (
        <Link 
          href={actionLink}
          className="text-accent hover:underline text-sm"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;