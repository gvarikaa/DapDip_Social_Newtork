"use client";

import React, { useState, useEffect } from 'react';
import UserSuggestion from './UserSuggestion';
import EmptyState from './EmptyState';

interface User {
  id: string;
  name: string;
  username: string;
  img?: string;
  bio?: string;
}

interface PersonalizedRecommendationsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  limit = 5,
  showHeader = true,
  className = '',
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/recommendations/personalized?limit=${limit}`, {
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
        
        // სატესტო მონაცემები შეცდომის შემთხვევაში
        setUsers([
          { id: '1', name: 'დავით ნოზაძე', username: 'dato', bio: 'პროგრამისტი | საქართველო' },
          { id: '2', name: 'თამარ კვარაცხელია', username: 'tamar', bio: 'დიზაინერი • ილუსტრატორი' },
          { id: '3', name: 'გიორგი მაისურაძე', username: 'giorgi', bio: 'მუსიკოსი | მოგზაური' },
          { id: '4', name: 'ნინო ფარულავა', username: 'ninofa', bio: 'მარკეტერი • ბლოგერი' },
          { id: '5', name: 'ლაშა ჭანტურია', username: 'lasha', bio: 'ფოტოგრაფი | ვიდეოგრაფი' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [limit]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && <h3 className="font-bold text-lg text-white">რეკომენდებული ხალხი</h3>}
        <div className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-light rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-secondary-light rounded w-24 mb-2"></div>
                <div className="h-3 bg-secondary-light rounded w-16"></div>
              </div>
              <div className="h-8 bg-secondary-light rounded-full w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && showHeader) {
    return (
      <div className={className}>
        <h3 className="font-bold text-lg text-white mb-2">რეკომენდებული ხალხი</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return <EmptyState message="ვერ მოიძებნა რეკომენდაციები" />;
  }

  return (
    <div className={className}>
      {showHeader && <h3 className="font-bold text-lg text-white mb-4">რეკომენდებული ხალხი</h3>}
      <div className="space-y-3">
        {users.map((user) => (
          <UserSuggestion key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;