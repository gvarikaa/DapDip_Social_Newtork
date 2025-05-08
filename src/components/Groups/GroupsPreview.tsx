"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Users, Brain, Wrench, ChevronRight, ArrowRight } from "lucide-react";

const GroupsPreview = () => {
  const [featuredGroups, setFeaturedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedGroups = async () => {
      try {
        // მოვითხოვოთ 3 პოპულარული ჯგუფი API-დან - publicOnly პარამეტრით, არაავტორიზებული მომხმარებლისთვისაც
        const response = await fetch("/api/groups?page=1&pageSize=3&featured=true&publicOnly=true");
        const data = await response.json();
        
        if (response.ok) {
          setFeaturedGroups(data.groups || []);
        } else {
          console.error("Error response:", data);
        }
      } catch (error) {
        console.error("Error fetching featured groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedGroups();
  }, []);

  // ჯგუფის ტიპის იკონის მიღება
  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'quantum':
        return <Brain className="w-4 h-4" />;
      case 'project':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-secondary-dark rounded-lg border border-borderGray-dark overflow-hidden">
      <div className="bg-secondary border-b border-borderGray-dark p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-accent mr-2" />
          <h3 className="text-white font-medium">ქვანტური აზრების ჯგუფები</h3>
        </div>
        <Link 
          href="/groups" 
          className="text-sm text-accent hover:text-accent-dark flex items-center"
        >
          ყველა
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="p-4">
        {loading ? (
          // ჩატვირთვის ანიმაცია
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-secondary rounded-lg p-3 animate-pulse">
                <div className="flex">
                  <div className="w-10 h-10 rounded-lg bg-secondary-dark"></div>
                  <div className="ml-3">
                    <div className="h-4 w-32 bg-secondary-dark rounded mb-2"></div>
                    <div className="h-3 w-24 bg-secondary-dark rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredGroups && Array.isArray(featuredGroups) && featuredGroups.length > 0 ? (
          <div className="space-y-2">
            {featuredGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block bg-secondary hover:bg-opacity-70 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary bg-opacity-20 text-accent rounded-lg flex items-center justify-center">
                    {group.icon || getGroupTypeIcon(group.type)}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-white font-medium">{group.name}</h4>
                    <div className="flex items-center text-xs text-gray-400">
                      <span className="flex items-center">
                        {getGroupTypeIcon(group.type)}
                        <span className="ml-1 mr-2">
                          {group.type === 'standard' ? 'სტანდარტული' : 
                           group.type === 'quantum' ? 'ქვანტური აზროვნების' : 
                           group.type === 'project' ? 'პროექტების' : 'საინფორმაციო'}
                        </span>
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {group._count?.members || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            <Link 
              href="/groups" 
              className="block mt-3 text-center text-accent hover:text-accent-dark py-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <div className="flex justify-center items-center">
                ჯგუფების ნახვა
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-3">ჯერ არ არის შექმნილი ჯგუფები</p>
            <Link 
              href="/groups" 
              className="text-accent hover:text-accent-dark font-medium"
            >
              გადასვლა ჯგუფების გვერდზე
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPreview;