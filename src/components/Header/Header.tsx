"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, MessageSquare, Home, Compass, User, Film, Users, Menu } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import { useSupabase } from '@/hooks/useSupabase';

const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useSupabase();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { href: '/', icon: Home, label: 'მთავარი' },
    { href: '/messages', icon: MessageSquare, label: 'ჩატი' },
    { href: '/notifications', icon: Bell, label: 'შეტყობინებები' },
    { href: '/explore', icon: Compass, label: 'ექსპლორი' },
    { href: '/reels', icon: Film, label: 'რილსი' },
    { href: '/groups', icon: Users, label: 'ჯგუფები' },
    { href: '/profile', icon: User, label: 'პროფილი' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background-darkOpacity50 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* ლოგო */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <AnimatedLogo />
          </Link>
        </div>

        {/* დესკტოპ ნავიგაცია */}
        <nav className="hidden md:flex items-center space-x-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`p-2.5 rounded-full transition-all duration-200 relative group ${
                isActive(link.href)
                  ? 'text-accent bg-accent/10'
                  : 'text-textGray-light hover:bg-secondary/50 hover:text-white'
              }`}
              title={link.label}
            >
              <link.icon className="w-5 h-5" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-background-dark rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {link.label}
              </span>
            </Link>
          ))}

          {/* ძებნის ღილაკი */}
          <button
            className="p-2.5 text-textGray-light hover:bg-secondary/50 hover:text-white rounded-full transition-all duration-200"
            title="ძებნა"
          >
            <Search className="w-5 h-5" />
          </button>
        </nav>

        {/* მობილური მენიუს ღილაკი */}
        <button
          className="md:hidden p-2 text-textGray-light hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* მობილური მენიუ - ჩამოსაშლელი */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-borderGray animate-fadeIn">
          <div className="container max-w-6xl mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`p-3 rounded-lg flex items-center ${
                    isActive(link.href)
                      ? 'bg-secondary text-accent'
                      : 'text-textGray-light hover:bg-secondary/50 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5 mr-3" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <button className="p-3 rounded-lg flex items-center text-textGray-light hover:bg-secondary/50 hover:text-white">
                <Search className="w-5 h-5 mr-3" />
                <span>ძებნა</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;