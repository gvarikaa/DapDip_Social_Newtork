"use client";

import { createUiAvatarUrl } from "@/utils/avatar";

type CustomImageProps = {
  src?: string | null | undefined;
  path?: string | null | undefined;
  w?: number;
  h?: number;
  alt: string;
  className?: string;
  tr?: boolean;
  isAvatar?: boolean;
  gender?: string | null | undefined;
  isCover?: boolean;
};

// ეს ფუნქცია ამოწმებს არის თუ არა სურათის ბმული სრულად მოცემული
const isFullUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const CustomImage = ({
  src,
  path,
  w,
  h,
  alt,
  className,
  tr,
  isAvatar,
  gender,
  isCover,
}: CustomImageProps) => {
  let imageUrl: string;
  
  if (src) {
    // თუ src პირდაპირ არის მოცემული, გამოვიყენოთ ის
    imageUrl = src;
  } else if (isAvatar) {
    // ავატარის სურათი
    if (!path) {
      // თუ path არ არის მითითებული, გამოვიყენოთ UI Avatars
      imageUrl = createUiAvatarUrl(alt, gender);
    } else if (isFullUrl(path)) {
      imageUrl = path;
    } else {
      // ლოკალური ფაილის შემთხვევაში
      imageUrl = createUiAvatarUrl(alt, gender);
    }
  } else if (isCover) {
    // ქავერის სურათი
    if (!path) {
      imageUrl = "https://source.unsplash.com/random/1200x400/?nature"; // დროებითი ფონური სურათი Unsplash-დან
    } else if (isFullUrl(path)) {
      imageUrl = path;
    } else {
      imageUrl = "https://source.unsplash.com/random/1200x400/?nature"; // დროებითი ფონური სურათი
    }
  } else if (path) {
    // იკონები და სხვა სურათები
    if (path.startsWith('icons/')) {
      // იკონები Feather Icons API-დან
      const iconName = path.replace('icons/', '').replace('.svg', '');
      imageUrl = `https://cdn.jsdelivr.net/npm/feather-icons@4.29.0/dist/icons/${iconName}.svg`;
    } else if (path.startsWith('general/')) {
      // ზოგადი სურათები - დროებით placeholder
      imageUrl = "https://via.placeholder.com/150";
    } else {
      // სხვა სურათები
      imageUrl = "https://via.placeholder.com/150";
    }
  } else {
    // საწყისი სურათი
    imageUrl = "https://via.placeholder.com/150";
  }
  
  // იმიჯ ტეგი ჩვეულებრივი HTML-ით
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={w}
      height={h}
      className={className || 'object-cover w-full h-full'}
      loading="lazy"
    />
  );
};

export default CustomImage;