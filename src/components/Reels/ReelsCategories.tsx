// src/components/Reels/ReelsCategories.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Hash } from "lucide-react";

interface Category {
  id: number;
  name: string;
  iconUrl?: string | null;
  _count: { reels: number };
}

interface ReelsCategoriesProps {
  categories: Category[];
}

const ReelsCategories = ({ categories }: ReelsCategoriesProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // სქროლის ღილაკები - გაუმჯობესებული ვერსია
  const scrollLeft = () => {
    if (containerRef.current) {
      // ადაპტიური სქროლი მოწყობილობის სიგანის მიხედვით
      const scrollAmount = window.innerWidth < 640 ? 150 : 250;
      containerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (containerRef.current) {
      // ადაპტიური სქროლი მოწყობილობის სიგანის მიხედვით
      const scrollAmount = window.innerWidth < 640 ? 150 : 250;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // სქროლის პოზიციის თვალყურის დევნება სქროლის ღილაკების ჩვენება/დამალვისთვის
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 10); // მცირე ბუფერი
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // მცირე ბუფერი
    }
  };
  
  // კატეგორიის არჩევა
  const handleCategorySelect = (categoryId: number | null) => {
    setActiveCategory(categoryId);
    
    if (categoryId) {
      router.push(`/reels/category/${categoryId}`);
    } else {
      router.push('/reels');
    }
  };
  
  // შევამოწმოთ თავდაპირველი სქროლის მდგომარეობა
  useEffect(() => {
    handleScroll();
    
    // ფანჯრის ზომის ცვლილებაზე რეაგირება
    const handleResize = () => {
      handleScroll();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // ვიპოვოთ აქტიური კატეგორია URL-დან
  useEffect(() => {
    if (pathname.includes('/reels/category/')) {
      const categoryId = parseInt(pathname.split('/').pop() || '0');
      if (categoryId) {
        setActiveCategory(categoryId);
        
        // გადავავანაცვლოთ კატეგორიის ხედვადობა
        setTimeout(() => {
          const activeElement = document.getElementById(`category-${categoryId}`);
          if (activeElement && containerRef.current) {
            const containerLeft = containerRef.current.getBoundingClientRect().left;
            const buttonLeft = activeElement.getBoundingClientRect().left;
            const scrollPosition = buttonLeft - containerLeft - 50; // 50 არის მარჯინი
            
            containerRef.current.scrollTo({
              left: scrollPosition,
              behavior: 'smooth'
            });
          }
        }, 300);
      }
    } else {
      setActiveCategory(null);
    }
  }, [pathname]);

  return (
    <div className="relative bg-background border-b border-borderGray-dark">
      {/* მარცხენა სქროლის ღილაკი */}
      {showLeftArrow && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-1 bg-background rounded-full shadow-lg text-gray-300 hover:text-white focus:outline-none"
          aria-label="წინა კატეგორიები"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      
      {/* კატეგორიების კონტეინერი */}
      <div 
        ref={containerRef} 
        className="flex items-center gap-2 py-2 px-6 overflow-x-auto scrollbar-hide"
        onScroll={handleScroll}
      >
        {/* "ყველა" კატეგორია */}
        <button
          id="category-all"
          onClick={() => handleCategorySelect(null)}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeCategory === null
              ? 'bg-accent text-white'
              : 'bg-secondary text-gray-300 hover:bg-secondary-light hover:text-white'
          }`}
        >
          <Hash size={14} className="opacity-70" />
          <span className="text-sm font-medium">ყველა</span>
        </button>
        
        {/* კატეგორიები - რესპონსიული */}
        {categories.map((category) => (
          <button
            key={category.id}
            id={`category-${category.id}`}
            onClick={() => handleCategorySelect(category.id)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors text-sm flex items-center gap-1.5 ${
              activeCategory === category.id
                ? 'bg-accent text-white shadow-button' 
                : 'bg-secondary text-gray-300 hover:bg-secondary-light hover:text-white'
            }`}
          >
            {category.iconUrl ? (
              <img 
                src={category.iconUrl} 
                alt="" 
                className="w-4 h-4 object-contain opacity-80" 
              />
            ) : (
              <Hash size={14} className="opacity-70" />
            )}
            <span className="font-medium">{category.name}</span>
            {category._count.reels > 0 && (
              <span className="ml-0.5 text-xs opacity-80">{category._count.reels}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* მარჯვენა სქროლის ღილაკი */}
      {showRightArrow && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-1 bg-background rounded-full shadow-lg text-gray-300 hover:text-white focus:outline-none"
          aria-label="შემდეგი კატეგორიები"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};

export default ReelsCategories;