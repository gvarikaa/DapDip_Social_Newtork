'use client';

import React, { useState } from 'react';
import { GroupSearch, GroupSearchResults } from '@/components/AI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';

export function GroupSearchPageClient() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // ჯგუფების ფილტრაცია აქტივობის მიხედვით
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'active':
        return searchResults.filter(group => 
          group._count.posts > 50 || group.activityLevel === 'high'
        );
      case 'new':
        // აქ შეიძლება გვქონდეს ლოგიკა ახალი ჯგუფების ფილტრაციისთვის,
        // მაგალითად createdAt-ს მიხედვით
        return searchResults.filter(group => {
          const createdAt = new Date(group.createdAt);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return createdAt > oneMonthAgo;
        });
      case 'recommended':
        // დაბრუნებს მაღალი რელევანტურობის ქულის მქონე ჯგუფებს
        return searchResults.filter(group => 
          group.relevanceScore && group.relevanceScore > 0.7
        );
      default:
        return searchResults;
    }
  };
  
  // შედეგების განახლება ძიებიდან
  const handleResultsChange = (results: any[]) => {
    setSearchResults(results);
    setLoading(false);
  };
  
  return (
    <div className="space-y-6">
      <GroupSearch 
        onResultsChange={handleResultsChange}
        showFilters={true}
      />
      
      {searchResults.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">ყველა შედეგი ({searchResults.length})</TabsTrigger>
                <TabsTrigger value="active">აქტიური ({getFilteredResults().length})</TabsTrigger>
                <TabsTrigger value="new">ახალი ({getFilteredResults().length})</TabsTrigger>
                <TabsTrigger value="recommended">რეკომენდებული ({getFilteredResults().length})</TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ნაპოვნია {searchResults.length} ჯგუფი
              </div>
            </div>
            
            <TabsContent value="all">
              <GroupSearchResults 
                results={searchResults} 
                loading={loading}
              />
            </TabsContent>
            
            <TabsContent value="active">
              <GroupSearchResults 
                results={getFilteredResults()} 
                loading={loading}
                emptyMessage="აქტიური ჯგუფები ვერ მოიძებნა"
              />
            </TabsContent>
            
            <TabsContent value="new">
              <GroupSearchResults 
                results={getFilteredResults()} 
                loading={loading}
                emptyMessage="ახალი ჯგუფები ვერ მოიძებნა"
              />
            </TabsContent>
            
            <TabsContent value="recommended">
              <GroupSearchResults 
                results={getFilteredResults()} 
                loading={loading}
                emptyMessage="რეკომენდებული ჯგუფები ვერ მოიძებნა"
              />
            </TabsContent>
          </Tabs>
          
          {/* ძიების შესახებ ინფორმაცია */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">როგორ მუშაობს AI ძიება</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                ჩვენი AI სისტემა აანალიზებს თქვენს ძიების მოთხოვნას და აფართოებს მას დაკავშირებული 
                კონცეფციებით. შედეგებს ალაგებს რელევანტურობის მიხედვით, თქვენი ინტერესებისა და 
                აქტივობის გათვალისწინებით. შედეგები მოიცავს ახსნას, თუ რატომ არის ესა თუ ის ჯგუფი 
                რეკომენდებული თქვენთვის.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}