"use client";

import { IKImage } from "imagekitio-next";
import { getAvatarUrl, getCoverUrl } from "@/utils/avatar";

type ImageType = {
  path?: string;
  src?: string;
  w?: number;
  h?: number;
  alt: string;
  className?: string;
  tr?: boolean;
  isAvatar?: boolean;
  gender?: string;
  isCover?: boolean;
};

const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT;

if (!urlEndpoint) {
  throw new Error('Error: Please add urlEndpoint to .env or .env.local')
}

const Image = ({ path, src, w, h, alt, className, tr, isAvatar, gender, isCover }: ImageType) => {
  // მომხმარებლის სურათების დამუშავება
  let finalPath = path;
  
  if (isAvatar) {
    // თუ ავატარის სურათია
    finalPath = getAvatarUrl(path, gender);
  } else if (isCover) {
    // თუ ქავერის სურათია
    finalPath = getCoverUrl(path);
  }
  
  return (
    <IKImage
      urlEndpoint={urlEndpoint}
      path={finalPath}
      src={src}
      {...(tr
        ? { transformation: [{ width: `${w}`, height: `${h}` }] }
        : { width: w, height: h })}
      lqip={{ active: true, quality: 20 }}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
};

export default Image;