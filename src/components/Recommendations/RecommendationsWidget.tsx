"use client";

import React, { useState, useEffect } from 'react';
import UserSuggestion from './UserSuggestion';
import EmptyState from './EmptyState';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  username: string;
  img?: string;
  bio?: string;
}

const RecommendationsWidget: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/recommendations/personalized', {
          cache: 'no-cache',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('რეკომენდაციების ჩატვირთვის შეცდომა');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError(err instanceof Error ? err.message : 'რეკომენდაციების ჩატვირთვა ვერ მოხერხდა');
        
        // მოდი სანიმუშო მონაცემები დავამატოთ შეცდომის შემთხვევაში
        setUsers([
          { id: '1', name: 'სანდრო მესხი', username: 'sandro', bio: 'დეველოპერი | დიზაინი | UI/UX' },
          { id: '2', name: 'ნინო ქავთარაძე', username: 'nino_k', bio: 'ფოტოგრაფი • ხელოვანი' },
          { id: '3', name: 'გიორგი დვალი', username: 'giodvali', bio: 'მუსიკოსი | პროდიუსერი' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white">გაიცანით ახალი ხალხი</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-light rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-secondary-light rounded w-24 mb-2"></div>
                <div className="h-3 bg-secondary-light rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="font-bold text-lg text-white mb-2">გაიცანით ახალი ხალხი</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return <EmptyState message="ვერ მოიძებნა რეკომენდაციები" />;
  }

  return (
    <div>
      <h3 className="font-bold text-lg text-white mb-3">გაიცანით ახალი ხალხი</h3>
      <div className="space-y-4">
        {users.map((user) => (
          <UserSuggestion key={user.id} user={user} />
        ))}
        <Link href="/explore/people" className="text-accent text-sm hover:underline block mt-2">
          მეტის ნახვა
        </Link>
      </div>
    </div>
  );
};

export default RecommendationsWidget;