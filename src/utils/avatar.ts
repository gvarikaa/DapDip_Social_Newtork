// src/utils/avatar.ts - პროფილის სურათების უტილიტი

/**
 * მიღებული სახელისგან ქმნის UI Avatars URL-ს
 * @param name სახელი ან მომხმარებლის სახელი ინიციალებისთვის
 * @param gender სქესი ფერის შესარჩევად (ოფციონალური)
 * @returns სრული URL UI Avatars-დან
 */
export function createUiAvatarUrl(name: string, gender?: string | null): string {
  // თუ სახელი არ არის მოცემული, გამოვიყენოთ "User"
  const displayName = name || 'User';
  
  // განვსაზღვროთ საწყისი ფერები სქესის მიხედვით
  let backgroundColor = '1D9BF0'; // ლურჯი - IconBlue - სქესის არჩევის გარეშე
  let color = 'FFFFFF'; // თეთრი
  
  if (gender === 'male') {
    backgroundColor = '3498db'; // მუქი ლურჯი
  } else if (gender === 'female') {
    backgroundColor = 'e84393'; // ვარდისფერი
  }
  
  // პარამეტრები:
  // name - სახელი რომლის ინიციალებიც გამოჩნდება
  // background - ფონის ფერი HEX ფორმატში
  // color - ტექსტის ფერი HEX ფორმატში
  // size - სურათის ზომა პიქსელებში
  // rounded - მრგვალი ფორმის ავატარი თუ true
  // bold - გასქელებული ტექსტი
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${backgroundColor}&color=${color}&size=128&rounded=true&bold=true`;
  
  return url;
}

/**
 * მომხმარებლის ავატარის URL-ის მიღება
 * @param userImg მომხმარებლის ატვირთული სურათის URL (შეიძლება იყოს null)
 * @param gender მომხმარებლის სქესი ("male", "female", "unspecified")
 * @param name მომხმარებლის სახელი UI Avatars-ისთვის (ოფციონალური)
 * @returns ავატარის სრული URL
 */
export function getAvatarUrl(userImg: string | null | undefined, gender: string | null | undefined, name?: string): string {
  // თუ მომხმარებელს აქვს სურათი, გამოვიყენოთ ის
  if (userImg) {
    // შევამოწმოთ არის თუ არა სრული URL
    if (userImg.startsWith('http://') || userImg.startsWith('https://')) {
      return userImg;
    }
    
    // თუ ეს ImageKit-ის path-ია, დავაბრუნოთ საწყისი ფორმით
    if (userImg.startsWith('/')) {
      return userImg;
    }
    
    // თუ ეს ლოკალური ფაილია
    return `/images/avatars/${userImg}`;
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
  // თუ მომხმარებელს აქვს ქავერი
  if (userCover) {
    // შევამოწმოთ არის თუ არა სრული URL
    if (userCover.startsWith('http://') || userCover.startsWith('https://')) {
      return userCover;
    }
    
    // თუ ეს ImageKit-ის path-ია, დავაბრუნოთ საწყისი ფორმით
    if (userCover.startsWith('/')) {
      return userCover;
    }
    
    // თუ ეს ლოკალური ფაილია
    return `/images/covers/${userCover}`;
  }
  
  // საწყისი ქავერი
  return "/images/covers/default-cover.jpg";
}