// src/utils/avatar.ts - პროფილის სურათების უტილიტი

/**
 * მიღებული სახელისგან ქმნის UI Avatars URL-ს
 * @param name სახელი ან მომხმარებლის სახელი ინიციალებისთვის
 * @param gender სქესი ფერის შესარჩევად (ოფციონალური)
 * @returns სრული URL UI Avatars-დან
 */
export function createUiAvatarUrl(name: string, gender?: string | null): string {
  // განვსაზღვროთ საწყისი ფერები სქესის მიხედვით
  let backgroundColor = '1D9BF0'; // ლურჯი - IconBlue - სქესის არჩევის გარეშე
  let color = 'FFFFFF'; // თეთრი
  
  if (gender === 'male') {
    backgroundColor = '3498db'; // მუქი ლურჯი
  } else if (gender === 'female') {
    backgroundColor = 'e84393'; // ვარდისფერი
  }
  
  // შევქმნათ სახელისგან ინიციალები (მაქსიმუმ ორი სიმბოლო)
  const displayName = name || 'User';
  
  // პარამეტრები:
  // name - სახელი რომლის ინიციალებიც გამოჩნდება
  // background - ფონის ფერი HEX ფორმატში
  // color - ტექსტის ფერი HEX ფორმატში
  // size - სურათის ზომა პიქსელებში
  // rounded - მრგვალი ფორმის ავატარი თუ true
  // bold - გასქელებული ტექსტი
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${backgroundColor}&color=${color}&size=128&rounded=true&bold=true`;
}

/**
 * მომხმარებლის ავატარის URL-ის მიღება
 * @param userImg მომხმარებლის ატვირთული სურათის URL (შეიძლება იყოს null)
 * @param gender მომხმარებლის სქესი ("male", "female", "unspecified")
 * @param name მომხმარებლის სახელი UI Avatars-ისთვის (ოფციონალური)
 * @returns ავატარის სრული URL
 */
export function getAvatarUrl(userImg: string | null | undefined, gender: string | null | undefined, name?: string): string {
  if (userImg) {
    return userImg;
  }
  
  // თუ მომხმარებელს არ აქვს სურათი, გამოვიყენოთ UI Avatars
  return createUiAvatarUrl(name || "User", gender);
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
  
  // საწყისი ქავერი
  return "/images/covers/default-cover.jpg";
}