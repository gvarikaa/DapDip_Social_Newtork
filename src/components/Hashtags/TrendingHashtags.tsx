"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HashtagBadge from './HashtagBadge';

interface TrendingHashtag {
  id: string;
  tag: string;
  count: number;
  posts?: number;
}

interface TrendingHashtagsProps {
  limit?: number;
  className?: string;
  onTagClick?: (tag: string) => void;
}

const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({
  limit = 5,
  className = '',
  onTagClick,
}) => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/hashtags/trending?limit=${limit}`, {
          cache: 'no-cache',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('ჰეშთეგების ჩატვირთვის შეცდომა');
        }
        
        const data = await response.json();
        setHashtags(data);
      } catch (err) {
        console.error('Failed to fetch trending hashtags:', err);
        setError(err instanceof Error ? err.message : 'ჰეშთეგების ჩატვირთვა ვერ მოხერხდა');
        // ტესტის მონაცემები შეცდომის შემთხვევაში
        setHashtags([
          { id: '1', tag: 'დიზაინი', count: 328, posts: 158 },
          { id: '2', tag: 'ტექნოლოგიები', count: 245, posts: 112 },
          { id: '3', tag: 'ხელოვნება', count: 189, posts: 89 },
          { id: '4', tag: 'მოგზაურობა', count: 156, posts: 74 },
          { id: '5', tag: 'მუსიკა', count: 132, posts: 63 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingHashtags();
  }, [limit]);

  // თუ ჩატვირთვის მდგომარეობაშია, ჩვენება ჩატვირთვის სკელეტონის
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="font-bold text-lg text-white">ტრენდული ჰეშთეგები</h3>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-3">
            <div className="h-6 bg-gray-700 rounded-full w-24"></div>
            <div className="h-4 bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  // შეცდომის შემთხვევაში
  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="font-bold text-lg text-white">ტრენდული ჰეშთეგები</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  // ჰეშთეგების გამოტანა
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-bold text-lg text-white">ტრენდული ჰეშთეგები</h3>
      
      {hashtags.length > 0 ? (
        <div className="space-y-4">
          {hashtags.map((hashtag) => (
            <div key={hashtag.id} className="flex items-center justify-between">
              <HashtagBadge 
                tag={hashtag.tag} 
                variant="default" 
                size="md"
                onClick={onTagClick ? () => onTagClick(hashtag.tag) : undefined}
              />
              <span className="text-sm text-textGray-light">
                {hashtag.posts || hashtag.count}+ პოსტი
              </span>
            </div>
          ))}
          <Link 
            href="/explore/hashtags" 
            className="text-accent text-sm hover:underline block"
          >
            მეტის ნახვა
          </Link>
        </div>
      ) : (
        <p className="text-textGray">ჰეშთეგები ვერ მოიძებნა</p>
      )}
    </div>
  );
};

export default TrendingHashtags;