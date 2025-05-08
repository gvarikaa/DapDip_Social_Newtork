"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Home, Compass, Search, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const ReelsNavigationBars = () => {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  // ნავიგაციის ელემენტები
  const navItems: NavItem[] = [
    { name: "მთავარი", path: "/", icon: Home },
    { name: "აღმოჩენა", path: "/explore", icon: Compass },
    { name: "ძიება", path: "/search", icon: Search },
    { name: "რილსები", path: "/reels", icon: ChevronLeft },
  ];

  // თვალყურის დევნება სქროლისთვის ნავიგაციის დასამალად/გამოსაჩენად
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;
      
      // მთავარი ლოგიკა: თუ ვსქროლავთ ქვემოთ, დავმალოთ ნავიგაცია
      if (currentScrollY > 100) {
        if (scrollDiff > 10) {
          setShowNav(false);
        } else if (scrollDiff < -10) {
          setShowNav(true);
        }
      } else {
        // თავში ყოველთვის გამოვაჩინოთ
        setShowNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // თუ ვიმყოფებით რილსებში, ნავიგაცია არ გვჭირდება
  if (!pathname.includes('/reels')) return null;

  return (
    <>
      {/* ქვედა ნავიგაცია მობილურზე */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-background-dark border-t border-borderGray-dark py-2 px-4 z-20 transition-transform duration-300 sm:hidden ${
          showNav ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-1 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
          
          <Link
            href="/reels/upload"
            className="flex flex-col items-center gap-1 text-accent hover:text-accent-light"
          >
            <PlusCircle size={20} />
            <span className="text-xs">ატვირთვა</span>
          </Link>
        </div>
      </div>
      
      {/* მარცხენა და მარჯვენა სანავიგაციო ღილაკები დესკტოპისთვის */}
      <div className="hidden md:block">
        <div className="fixed top-1/2 left-4 -translate-y-1/2 z-20">
          <Link
            href="/"
            className="p-3 bg-background-dark bg-opacity-70 backdrop-blur-sm rounded-full shadow-lg text-white hover:bg-background transition-colors"
            title="მთავარზე დაბრუნება"
          >
            <ChevronLeft size={20} />
          </Link>
        </div>
        
        <div className="fixed top-1/2 right-4 -translate-y-1/2 z-20">
          <Link
            href="/explore"
            className="p-3 bg-background-dark bg-opacity-70 backdrop-blur-sm rounded-full shadow-lg text-white hover:bg-background transition-colors"
            title="აღმოჩენა"
          >
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </>
  );
};

export default ReelsNavigationBars;