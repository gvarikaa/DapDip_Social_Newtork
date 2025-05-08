/**
 * ტექსტის შიგნით ჰეშთეგების გამოყოფის ფუნქცია
 * @param text ტექსტი ჰეშთეგებით
 * @returns ჰეშთეგების მასივი
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  
  // ვეძებთ # სიმბოლოთი დაწყებულ სიტყვებს, რომლებიც მთავრდება სივრცით ან პუნქტუაციით
  const hashtagRegex = /#([a-zა-ჰ0-9_]+)/gi;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // მოვაცილოთ # სიმბოლო და დავაბრუნოთ უნიკალური ჰეშთეგები
  const hashtags = matches.map(tag => tag.substring(1).toLowerCase());
  return Array.from(new Set(hashtags));
}

/**
 * ჰეშთეგების შენახვა მონაცემთა ბაზაში
 * @param postId პოსტის ID
 * @param hashtags ჰეშთეგების მასივი
 */
import { prisma } from "@/prisma";

export async function saveHashtags(postId: number, hashtags: string[]): Promise<void> {
  try {
    console.log(`Saving hashtags for post ${postId}:`, hashtags);
    
    if (!hashtags || hashtags.length === 0) return;
    
    // გავასუფთაოთ ჰეშთეგები
    const validHashtags = sanitizeHashtags(hashtags);
    
    if (validHashtags.length === 0) return;
    
    // შევქმნათ ან მოვძებნოთ ჰეშთეგები და მივაბათ პოსტს
    for (const tag of validHashtags) {
      // მოვძებნოთ ან შევქმნათ ჰეშთეგი
      let hashtag = await prisma.hashtag.findUnique({
        where: { name: tag }
      });
      
      if (!hashtag) {
        hashtag = await prisma.hashtag.create({
          data: { name: tag }
        });
      }
      
      // შევქმნათ კავშირი პოსტსა და ჰეშთეგს შორის
      await prisma.postHashtag.create({
        data: {
          postId,
          hashtagId: hashtag.id
        }
      });
    }
    
    console.log(`Successfully saved ${validHashtags.length} hashtags for post ${postId}`);
  } catch (error) {
    console.error("Error saving hashtags:", error);
  }
}

/**
 * ტექსტის შიგნით ყველა ჰეშთეგის ბმულებით ჩანაცვლება
 * @param text საწყისი ტექსტი
 * @returns ჰეშთეგების ბმულებით განახლებული ტექსტი
 */
export function linkifyHashtags(text: string): string {
  if (!text) return '';
  
  // ვეძებთ ჰეშთეგებს და ვანაცვლებთ ბმულებით
  return text.replace(
    /#([a-zა-ჰ0-9_]+)/gi,
    '<a href="/hashtag/$1" class="text-accent hover:underline">#$1</a>'
  );
}

/**
 * საპოპულარო ჰეშთეგების გასაწმენდი ფუნქცია
 * მინ 2 სიმბოლო, მაქს 30 სიმბოლო, მხოლოდ ასოები, ციფრები და ქვედა ტირე
 * @param hashtag გასაწმენდი ჰეშთეგი 
 * @returns გაწმენდილი ჰეშთეგი ან null თუ არასწორია
 */
export function sanitizeHashtag(hashtag: string): string | null {
  // მოვაცილოთ # სიმბოლო თავში (თუ არსებობს)
  const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
  
  // შევამოწმოთ სიმბოლოები და სიგრძე
  const validHashtagRegex = /^[a-zა-ჰ0-9_]{2,30}$/i;
  return validHashtagRegex.test(cleanHashtag) ? cleanHashtag.toLowerCase() : null;
}

/**
 * ჰეშთეგების მასივის სანიტაიზაცია
 * @param hashtags ჰეშთეგების მასივი
 * @returns გაწმენდილი უნიკალური ჰეშთეგების მასივი
 */
export function sanitizeHashtags(hashtags: string[]): string[] {
  if (!hashtags || !Array.isArray(hashtags)) return [];
  
  const validHashtags = hashtags
    .map(tag => sanitizeHashtag(tag))
    .filter((tag): tag is string => tag !== null);
  
  // ვაბრუნებთ უნიკალურ ჰეშთეგებს
  return Array.from(new Set(validHashtags));
}