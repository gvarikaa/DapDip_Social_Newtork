// src/types.ts - მთელი აპლიკაციის ტიპები ერთ ფაილში


// მომხმარებლის ტიპი
export interface UserType {
  id: string;
  username: string;
  displayName: string | null;
  email?: string;
  bio: string | null;
  location: string | null;
  job: string | null;
  website: string | null;
  img: string | null;
  cover: string | null;
  gender: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // რელაციების რაოდენობა
  _count: {
    followers: number;
    followings: number;
    posts: number;
  };
  
  // დამატებითი ინფორმაცია
  isFollowed?: boolean;
  followings?: any[]; // დავამატეთ followings ველი მასივის სახით
  latestPost?: {
    id: number;
    content: string | null;
    createdAt: Date | string;
  } | null;
}

// პოსტის ტიპი
export interface PostType {
  id: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  desc: string | null;
  img: string | null;
  imgHeight: number | null;
  video: string | null;
  isSensitive: boolean;
  userId: string;
  rePostId: number | null;
  parentPostId: number | null;
  
  // რელაციები
  user: {
    id: string;
    username: string;
    displayName: string | null;
    img: string | null;
    gender?: string | null;
  };
  
  // ჩართულობა
  _count: {
    likes: number;
    rePosts: number;
    comments: number;
  };
  
  // მიმდინარე მომხმარებლის ჩართულობა
  likes: { id: number }[];
  rePosts: { id: number }[];
  saves: { id: number }[];
  
  // რეპოსტის შემთხვევაში
  rePost?: PostType | null;
}

// მესიჯის ტიპი
export interface MessageType {
  id: number;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  readAt: Date | string | null;
  isEdited: boolean;
  attachmentUrl: string | null;
  attachmentType: string | null;
  replyToId: number | null;
  
  // გამგზავნის ინფორმაცია
  sender?: {
    username: string;
    displayName: string | null;
    img: string | null;
    gender?: string | null;
  };
}

// კონვერსაციის ტიპი
export interface ConversationType {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  groupAdminId: string | null;
  
  // რელაციები
  participants: ConversationParticipantType[];
  messages: MessageType[];
  
  // მეორე მომხმარებლის ინფო (პირადი საუბრის შემთხვევაში)
  otherUser?: {
    id: string;
    username: string;
    displayName: string | null;
    img: string | null;
    gender?: string | null;
    isOnline?: boolean;
  } | null;
}

// კონვერსაციის მონაწილის ტიპი
export interface ConversationParticipantType {
  userId: string;
  conversationId: string;
  joinedAt: Date | string;
  lastReadAt: Date | string | null;
  
  // მომხმარებლის ინფორმაცია
  user: {
    id: string;
    username: string;
    displayName: string | null;
    img: string | null;
    gender?: string | null;
  };
}

// მედიის ტიპი
export interface MediaType {
  id: string;
  type: "image" | "video" | "file";
  url: string;
  thumbnailUrl?: string;
  filename?: string;
  timestamp: string;
  senderId?: string;
}

// აი კომენტარის ტიპი
export interface AICommentType {
  id: number;
  content: string;
  createdAt: Date | string;
  postId: number;
  requestedById: string;
}

// დისკუსიის შეჯამების ტიპი
export interface DiscussionSummaryType {
  id: number;
  content: string;
  createdAt: Date | string;
  postId: number;
  requestedById: string;
}

// პოსტის ანალიზის ტიპი
export interface PostAnalysisType {
  id: number;
  content: string;
  createdAt: Date | string;
  postId: number;
  requestedById: string;
  
  // დაპარსული მონაცემები
  parsedData?: {
    factCheck: {
      truthScore: number;
      isFake: boolean;
      explanation: string;
      realFacts?: string;
    };
    tonalAnalysis: {
      negative: number;
      positive: number;
      neutral: number;
      aggressive: number;
      humorous: number;
    };
  };
}