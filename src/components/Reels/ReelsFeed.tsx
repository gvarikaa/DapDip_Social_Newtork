// src/components/Reels/ReelsFeed.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import ReelCard from "./ReelCard";
import ReelsSkeleton from "./ReelsSkeleton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Sparkles, Globe, RefreshCcw, ArrowUp } from "lucide-react";
import { useSwipeable } from "react-swipeable";

// რილსების მიღება API-დან
const fetchReels = async (page: number, categoryId?: string, personalized: boolean = true) => {
  const url = new URL(`${window.location.origin}/api/reels`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("personalized", personalized.toString());
  
  if (categoryId) {
    url.searchParams.append("category", categoryId);
  }
  
  const res = await fetch(url.toString());
  
  if (!res.ok) {
    throw new Error("რილსების ჩატვირთვა ვერ მოხერხდა");
  }
  
  return res.json();
};

interface ReelsFeedProps {
  categoryId?: string;
  initialData?: any;
}

const ReelsFeed = ({ categoryId, initialData }: ReelsFeedProps) => {
  // პერსონალიზაციის პრეფერენცია ლოკალურ სტორიჯში
  const [storedPersonalized, setStoredPersonalized] = useLocalStorage('reels-personalized', true);
  // კლიენტის მხარეს პერსონალიზაციის რეალური მდგომარეობა
  const [personalized, setPersonalized] = useState(true);
  
  // მიმდინარე რილსის ინდექსი
  const [activeIndex, setActiveIndex] = useState(0);
  // სქროლის მდგომარეობა
  const [isScrolling, setIsScrolling] = useState(false);
  // დავიმახსოვროთ ბოლო თაჩის პოზიცია სწაიპისთვის
  const [touchStartY, setTouchStartY] = useState(0);
  // მაღლა სქროლის ღილაკის ჩვენება
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // რეფერენსები
  const feedRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // კლიენტის მხარეს პერსონალიზაციის მდგომარეობის სინქრონიზაცია
  useEffect(() => {
    setPersonalized(storedPersonalized);
  }, [storedPersonalized]);
  
  // პერსონალიზაციის ცვლილების ფუნქცია
  const togglePersonalized = () => {
    const newValue = !personalized;
    setPersonalized(newValue);
    setStoredPersonalized(newValue);
    // ვდაბრუნდეთ პირველ რილსზე და განვაახლოთ მონაცემები
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
    setActiveIndex(0);
  };
  
  // რილსების ჩატვირთვა
  const { 
    data, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ["reels", categoryId, personalized],
    queryFn: ({ pageParam = 1 }) => fetchReels(pageParam, categoryId, personalized),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialData: initialData ? {
      pages: [initialData],
      pageParams: [1]
    } : undefined
  });
  
  // ყველა რილსის მიღება
  const allReels = data?.pages.flatMap((page) => page.reels) || [];
  
  // ვიდეოს ჩატვირთვის ინდიკატორი
  const [loadingVideos, setLoadingVideos] = useState<Record<string, boolean>>({});
  
  // ვიდეოს ჩატვირთვის დამთავრების ფუნქცია
  const handleVideoLoad = (reelId: string) => {
    setLoadingVideos(prev => ({ ...prev, [reelId]: false }));
  };
  
  // სქროლის თვალყურის დევნა შემდეგი ჩატვირთვისთვის
  const [bottomRef, inView] = useInView({
    threshold: 0.5
  });
  
  // თუ ბოლოში მივედით, ჩავტვირთოთ მეტი
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // მიმდინარე რილსის განსაზღვრა სქროლის პოზიციით
  const handleScroll = useCallback(() => {
    if (!feedRef.current || allReels.length === 0) return;
    
    // სქროლის მდგომარეობა მოძრაობისას
    setIsScrolling(true);
    
    // სქროლის მდგომარეობიდან გამოსვლა მცირე დაყოვნებით
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 200);
    
    // გამოვაჩინოთ "მაღლა" ღილაკი, როცა საკმარისად ქვემოთ ჩავსქროლეთ
    if (feedRef.current.scrollTop > window.innerHeight) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
    
    const container = feedRef.current;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    
    // ვიპოვოთ მიმდინარე აქტიური ინდექსი
    const newIndex = Math.round(scrollPosition / itemHeight);
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < allReels.length) {
      setActiveIndex(newIndex);
      // წინასწარ ვნიშნავთ ვიდეოს ჩატვირთვას
      setLoadingVideos(prev => ({ ...prev, [allReels[newIndex].id]: true }));
    }
  }, [activeIndex, allReels]);
  
  // დავარეგისტრიროთ სქროლის ევენთი
  useEffect(() => {
    const container = feedRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // სწრაფად გადასვლა შემდეგ რილსზე
  const goToNextReel = useCallback(() => {
    if (activeIndex < allReels.length - 1 && feedRef.current) {
      const newIndex = activeIndex + 1;
      feedRef.current.scrollTo({
        top: newIndex * feedRef.current.clientHeight,
        behavior: 'smooth'
      });
      setActiveIndex(newIndex);
      setLoadingVideos(prev => ({ ...prev, [allReels[newIndex].id]: true }));
    }
  }, [activeIndex, allReels]);
  
  // სწრაფად გადასვლა წინა რილსზე
  const goToPrevReel = useCallback(() => {
    if (activeIndex > 0 && feedRef.current) {
      const newIndex = activeIndex - 1;
      feedRef.current.scrollTo({
        top: newIndex * feedRef.current.clientHeight,
        behavior: 'smooth'
      });
      setActiveIndex(newIndex);
      setLoadingVideos(prev => ({ ...prev, [allReels[newIndex].id]: true }));
    }
  }, [activeIndex, allReels]);
  
  // მაღლა სქროლი
  const scrollToTop = () => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setActiveIndex(0);
    }
  };
  
  // განახლება
  const handleRefresh = async () => {
    try {
      await refetch();
      if (feedRef.current) {
        feedRef.current.scrollTop = 0;
      }
      setActiveIndex(0);
    } catch (err) {
      console.error("რილსების განახლების შეცდომა:", err);
    }
  };
  
  // კლავიატურის ღილაკებით ნავიგაცია
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrevReel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextReel, goToPrevReel]);
  
  // სწაიპი - დავარეგისტრიროთ swipeable-ის ნაცვლად მარტივი ტაჩ ჰენდლერები
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    
    // მინიმალური მანძილი, რომ ჩაითვალოს სწაიპად
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // სწაიპი ქვემოდან ზემოთ
        goToPrevReel();
      } else {
        // სწაიპი ზემოდან ქვემოთ
        goToNextReel();
      }
    }
  };
  
  // თუ ჩატვირთვა მიმდინარეობს და არ გვაქვს მონაცემები
  if (isLoading && !data) {
    return <ReelsSkeleton count={1} />;
  }

  // თუ შეცდომაა
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div className="p-4 bg-accent/10 rounded-lg max-w-xs">
          <p className="text-accent mb-2">რილსების ჩატვირთვისას დაფიქსირდა შეცდომა</p>
          <button 
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-accent text-white rounded-full text-sm flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCcw size={16} />
            <span>ხელახლა ცდა</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
      {/* პერსონალიზაციის გადამრთველი */}
      <div className="absolute top-4 right-4 z-30">
        <button 
          onClick={togglePersonalized}
          suppressHydrationWarning
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-colors sm:text-sm ${
            personalized 
              ? "bg-accent text-white" 
              : "bg-gray-800 text-gray-300"
          }`}
        >
          {personalized ? (
            <>
              <Sparkles size={16} />
              <span suppressHydrationWarning className="hidden xs:inline">
                პერსონალიზებული
              </span>
            </>
          ) : (
            <>
              <Globe size={16} />
              <span suppressHydrationWarning className="hidden xs:inline">
                ახალი
              </span>
            </>
          )}
        </button>
      </div>
      
      {/* განახლების ღილაკი */}
      <div className="absolute top-4 left-4 z-30">
        <button 
          onClick={handleRefresh}
          className="p-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCcw size={18} />
        </button>
      </div>
      
      {/* რილსების ლენტი - ვერტიკალური სქროლი */}
      <div 
        ref={feedRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {allReels.map((reel, index) => (
          <div 
            key={reel.id}
            className="h-full w-full snap-start snap-always relative"
            style={{scrollSnapAlign: 'start'}}
          >
            <ReelCard 
              reel={reel}
              isActive={index === activeIndex}
              onLoad={() => handleVideoLoad(reel.id)}
              isLoading={loadingVideos[reel.id] || false}
              onNext={goToNextReel}
              onPrevious={goToPrevReel}
            />
          </div>
        ))}
        
        {/* ჩატვირთვის ინდიკატორი */}
        {(isFetchingNextPage || hasNextPage) && (
          <div 
            ref={bottomRef}
            className="h-24 flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* უკან დაბრუნების ღილაკი */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-accent text-white shadow-lg z-30 transform transition-transform hover:scale-110 active:scale-95"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default ReelsFeed;