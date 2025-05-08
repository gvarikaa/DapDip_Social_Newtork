"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import InfiniteFeed from '@/components/InfiniteFeed';
import { useSupabase } from '@/hooks/useSupabase';
import { HashtagBadge } from '@/components/Hashtags';

interface HashtagPageProps {}

const HashtagPage: React.FC<HashtagPageProps> = () => {
  const params = useParams();
  const tag = params.tag as string;
  const decodedTag = decodeURIComponent(tag);
  const { user } = useSupabase();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postCount, setPostCount] = useState<number | null>(null);
  
  useEffect(() => {
    // პოსტების რაოდენობის ჩატვირთვა
    const fetchHashtagStats = async () => {
      try {
        const response = await fetch(`/api/hashtags/search?q=${decodedTag}&limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setPostCount(data[0].count || data[0].posts);
          }
        }
      } catch (err) {
        console.error('Failed to fetch hashtag stats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHashtagStats();
  }, [decodedTag]);
  
  // თუ ჩატვირთვის მდგომარეობაშია
  if (loading) {
    return (
      <div className="p-4 max-w-screen-md mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-secondary rounded-lg w-1/2"></div>
          <div className="h-6 bg-secondary rounded-lg w-1/4"></div>
          <div className="h-[800px] bg-secondary rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // შეცდომის შემთხვევაში
  if (error) {
    return (
      <div className="p-4 max-w-screen-md mx-auto">
        <div className="bg-secondary-dark p-6 rounded-lg">
          <h1 className="text-xl text-red-400 mb-4">შეცდომა</h1>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HashtagBadge tag={decodedTag} size="lg" variant="accent" />
          {postCount !== null && (
            <span className="text-white text-sm">
              {postCount} პოსტი
            </span>
          )}
        </div>
        <p className="text-textGray-light">
          გაეცანით უახლეს პოსტებს თემაზე #{decodedTag}
        </p>
      </div>
      
      <InfiniteFeed
        apiEndpoint={`/api/posts?hashtag=${encodeURIComponent(decodedTag)}`}
        showNewPosts={true}
        emptyStateMessage={`ჰეშთეგ #${decodedTag}-სთვის არ მოიძებნა პოსტები`}
      />
    </div>
  );
};

export default HashtagPage;