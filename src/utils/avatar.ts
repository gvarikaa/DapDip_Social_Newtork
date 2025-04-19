// src/utils/avatar.ts - პროფილის სურათების უტილიტი

// საწყისი სურათების კონფიგურაცია
export const DEFAULT_AVATARS = {
  male: "avatars/default-male.png",
  female: "avatars/default-female.png",
  unspecified: "avatars/default-avatar.png"
};

export const DEFAULT_COVERS = {
  default: "covers/default-cover.jpg"
};

/**
 * მომხმარებლის ავატარის URL-ის მიღება
 * @param userImg მომხმარებლის ატვირთული სურათის URL (შეიძლება იყოს null)
 * @param gender მომხმარებლის სქესი ("male", "female", "unspecified")
 * @returns ავატარის სრული URL
 */
export function getAvatarUrl(userImg: string | null | undefined, gender: string | null | undefined): string {
  if (userImg) {
    return userImg;
  }
  
  // თუ სქესი არ არის მითითებული ან არავალიდურია, უნივერსალურ ავატარს ვაბრუნებთ
  const safeGender = gender && (gender === "male" || gender === "female") 
    ? gender 
    : "unspecified";
    
  return DEFAULT_AVATARS[safeGender];
}

/**
 * მომხმარებლის ქავერის URL-ის მიღება
 * @param userCover მომხმარებლის ატვირთული ქავერის URL (შეიძლება იყოს null)
 * @returns ქავერის სრული URL
 */
export function getCoverUrl(userCover: string | null | undefined): string {
  if (userCover) {
    return userCover;
  }
  
  return DEFAULT_COVERS.default;
}