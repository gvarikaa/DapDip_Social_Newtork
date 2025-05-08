"use client";

import { useState, useEffect } from 'react';

type VideoTypes = {
  path: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
};

const BunnyVideo = ({ 
  path, 
  className, 
  controls = true, 
  autoPlay = false, 
  muted = false, 
  loop = false 
}: VideoTypes) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Bunny Stream-ის URL-ის აგება
      const baseUrl = "https://dapdip.b-cdn.net";
      
      // თუ path უკვე სრული URL-ია, გამოვიყენოთ როგორც არის
      if (path.startsWith('http://') || path.startsWith('https://')) {
        setVideoUrl(path);
      } else {
        // შევქმნათ Bunny CDN URL
        const url = `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
        setVideoUrl(url);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("BunnyVideo URL შექმნის შეცდომა:", error);
      setError("ვიდეოს ჩატვირთვა ვერ მოხერხდა");
      setIsLoading(false);
    }
  }, [path]);

  if (error) {
    return (
      <div className={`bg-secondary flex items-center justify-center text-textGray ${className}`}>
        ვიდეო ვერ ჩაიტვირთა
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-secondary ${className}`}></div>
    );
  }

  return (
    <video 
      src={videoUrl}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
    />
  );
};

export default BunnyVideo;