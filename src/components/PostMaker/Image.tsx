"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

type ImageType = {
  path?: string;
  src?: string;
  w?: number;
  h?: number;
  alt: string;
  className?: string;
  tr?: boolean;
};

const BunnyImage = ({ path, src, w, h, alt, className, tr }: ImageType) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL შექმნა Bunny CDN-ისთვის
    try {
      const baseUrl = "https://dapdip.b-cdn.net"; // Bunny CDN ფუძე URL
      
      // თუ src პირდაპირი URL-ია, გამოვიყენოთ როგორც არის
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        setImageUrl(src);
      } 
      // თუ path მოცემულია, ავაგოთ Bunny CDN URL
      else if (path) {
        // ტრანსფორმაციის პარამეტრები
        const transformParams = tr && w && h ? `/fit-in/${w}x${h}` : '';
        
        // შევქმნათ საბოლოო URL - აქ არის შესწორება
        const url = path.startsWith('http') 
          ? path // თუ უკვე URL-ია
          : `${baseUrl}${transformParams}/${path.startsWith('/') ? path.substring(1) : path}`;
        setImageUrl(url);
      } 
      // არცერთი არ არის მოცემული - გამოვიყენოთ placeholder
      else {
        setImageUrl('/placeholder.jpg');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("BunnyImage URL შექმნის შეცდომა:", error);
      setError("სურათის ჩატვირთვა ვერ მოხერხდა");
      setIsLoading(false);
    }
  }, [path, src, w, h, tr]);

  if (error) {
    return <img src="/placeholder.jpg" alt={alt} className={className} />;
  }

  if (isLoading) {
    return <div className={`animate-pulse bg-secondary ${className}`}></div>;
  }

  // გამოვიყენოთ Next.js Image კომპონენტი უკეთესი ოპტიმიზაციისთვის, თუ ზომები მოცემულია
  if (w && h) {
    return (
      <Image 
        src={imageUrl}
        width={w}
        height={h}
        alt={alt}
        className={className}
        unoptimized={!imageUrl.includes('dapdip.b-cdn.net')} // მხოლოდ Bunny CDN-ზე ვოპტიმიზაციოთ
      />
    );
  }

  // სტანდარტული img თეგი, თუ ზომები არ არის მოცემული
  return <img src={imageUrl} alt={alt} className={className} />;
};

export default BunnyImage;