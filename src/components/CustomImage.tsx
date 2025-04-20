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
    imageUrl = src;
  } else if (isAvatar) {
    if (!path) {
      imageUrl = createUiAvatarUrl(alt, gender);
    } else if (isFullUrl(path)) {
      imageUrl = path;
    } else {
      imageUrl = createUiAvatarUrl(alt, gender);
    }
  } else if (isCover) {
    if (!path) {
      imageUrl = "https://source.unsplash.com/random/1200x400/?nature";
    } else if (isFullUrl(path)) {
      imageUrl = path;
    } else {
      imageUrl = "https://source.unsplash.com/random/1200x400/?nature";
    }
  } else if (path) {
    if (path.startsWith('icons/')) {
      const iconName = path.replace('icons/', '').replace('.svg', '');
      imageUrl = `https://cdn.jsdelivr.net/npm/feather-icons@4.29.0/dist/icons/${iconName}.svg`;
    } else if (path.startsWith('general/')) {
      // ვარაუდით, რომ ზოგადი სურათები ან ლოკალურია public/images/general/ საქაღალდეში,
      // ან ImageKit-ზეა general/ საქაღალდეში.
      if (process.env.NEXT_PUBLIC_IMAGEKIT_URL) {
        imageUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL}/${path}`;
      } else {
        imageUrl = `/images/${path}`; // ლოკალური გზა public-დან
      }
    } else {
      // სხვა სურათებისთვის - საჭიროა თქვენი ლოგიკა
      imageUrl = "https://via.placeholder.com/150";
    }
  } else {
    imageUrl = "https://via.placeholder.com/150";
  }

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