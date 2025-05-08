"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Heart, MessageCircle, MoreHorizontal, Clock, X } from "lucide-react";
import ProfileAvatar from "../Avatar/ProfileAvatar";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import FormattedText from "../PostMaker/FormattedText";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  img: string | null;
  avatarProps: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  user: User;
  _count: {
    likes: number;
    replies: number;
  };
  likes: { id: string }[];
  parentId: string | null;
  // რეალურად მონაცემთა ბაზაში არ არის, მაგრამ კლიენტის მხარეს გამოვიყენებთ
  replies?: Comment[];
  isReplying?: boolean;
};

interface ReelCommentsProps {
  reelId: string;
  initialComments: Comment[];
  currentUser: User;
}

const ReelComments = ({ reelId, initialComments, currentUser }: ReelCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialComments.length >= 20);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  
  const [bottomRef, inView] = useInView({
    threshold: 0.5
  });
  
  // კომენტარის ფორმატირება
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "ახლახანს";
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} წუთის წინ`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} საათის წინ`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)} დღის წინ`;
    } else if (diffInSeconds < 31536000) {
      return `${Math.floor(diffInSeconds / 2592000)} თვის წინ`;
    } else {
      return `${Math.floor(diffInSeconds / 31536000)} წლის წინ`;
    }
  };
  
  // ფოკუსირება კომენტარის ველზე პასუხის გასაცემად
  useEffect(() => {
    if (replyToComment && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [replyToComment]);
  
  // მეტი კომენტარის ჩატვირთვა
  const loadMoreComments = async () => {
    if (isFetchingMore || !hasMore) return;
    
    setIsFetchingMore(true);
    
    try {
      const lastCommentId = comments[comments.length - 1]?.id;
      
      // სერვერიდან ჩატვირთვა
      const response = await fetch(`/api/reels/${reelId}/comments?cursor=${lastCommentId}&limit=10`);
      
      if (!response.ok) {
        throw new Error("კომენტარების ჩატვირთვა ვერ მოხერხდა");
      }
      
      const data = await response.json();
      
      setComments(prev => [...prev, ...data.comments]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("კომენტარების ჩატვირთვის შეცდომა:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };
  
  // ამოვხსნათ კომენტარის პასუხები
  const loadReplies = async (comment: Comment) => {
    try {
      // სერვერიდან ჩატვირთვა
      const response = await fetch(`/api/reels/${reelId}/comments/${comment.id}/replies`);
      
      if (!response.ok) {
        throw new Error("პასუხების ჩატვირთვა ვერ მოხერხდა");
      }
      
      const data = await response.json();
      
      // ვიპოვოთ კომენტარი და დავამატოთ პასუხები
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, replies: data.replies }
          : c
      ));
    } catch (error) {
      console.error("პასუხების ჩატვირთვის შეცდომა:", error);
    }
  };
  
  // ავტომატური ჩატვირთვა, როცა ბოლოს მივაღწევთ
  useEffect(() => {
    if (inView && hasMore && !isFetchingMore) {
      loadMoreComments();
    }
  }, [inView, hasMore, isFetchingMore]);
  
  // კომენტარის დამატება
  const addComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        content: commentText,
        parentId: replyToComment?.id || null
      };
      
      // სერვერზე გაგზავნა
      const response = await fetch(`/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error("კომენტარის დამატება ვერ მოხერხდა");
      }
      
      const data = await response.json();
      
      // თუ ეს პასუხია
      if (replyToComment) {
        // ვიპოვოთ მშობელი კომენტარი და დავამატოთ პასუხი
        setComments(prev => prev.map(c => 
          c.id === replyToComment.id 
            ? { 
                ...c, 
                _count: { 
                  ...c._count, 
                  replies: c._count.replies + 1 
                },
                replies: c.replies 
                  ? [data.comment, ...c.replies]
                  : [data.comment] 
              }
            : c
        ));
        
        // გავასუფთავოთ პასუხის მდგომარეობა
        setReplyToComment(null);
      } else {
        // ჩვეულებრივი კომენტარი
        setComments(prev => [data.comment, ...prev]);
      }
      
      // გავასუფთავოთ შეტანის ველი
      setCommentText("");
    } catch (error) {
      console.error("კომენტარის დამატების შეცდომა:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // კომენტარის მოწონება
  const likeComment = async (comment: Comment) => {
    try {
      // ლოკალურად განახლება დაუყოვნებლივი უკუკავშირისთვის
      const isLiked = comment.likes.length > 0;
      
      if (isLiked) {
        // მოწონების მოხსნა
        setComments(prev => prev.map(c => 
          c.id === comment.id 
            ? { 
                ...c, 
                likes: [],
                _count: { 
                  ...c._count, 
                  likes: c._count.likes - 1 
                } 
              }
            : c
        ));
      } else {
        // მოწონება
        setComments(prev => prev.map(c => 
          c.id === comment.id 
            ? { 
                ...c, 
                likes: [{ id: 'temp-like-id' }],
                _count: { 
                  ...c._count, 
                  likes: c._count.likes + 1 
                } 
              }
            : c
        ));
      }
      
      // სერვერზე გაგზავნა
      const response = await fetch(`/api/reels/${reelId}/comments/${comment.id}/like`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error("მოწონების ცვლილება ვერ მოხერხდა");
        // აქ შეგვიძლია დავაბრუნოთ საწყისი მდგომარეობა შეცდომის შემთხვევაში
      }
    } catch (error) {
      console.error("მოწონების ცვლილების შეცდომა:", error);
    }
  };
  
  // კლავიატურით კომენტარის გაგზავნა
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };
  
  return (
    <div ref={commentsContainerRef} className="flex flex-col">
      {/* კომენტარის დამატების ფორმა */}
      <div className="mb-6 bg-secondary-dark rounded-lg p-3 sticky top-16 z-10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <ProfileAvatar
              imageUrl={currentUser.img}
              username={currentUser.username}
              avatarProps={currentUser.avatarProps}
              size="sm"
            />
          </div>
          
          <div className="flex-1 relative">
            {/* პასუხის ინდიკატორი */}
            {replyToComment && (
              <div className="flex items-center justify-between bg-secondary p-2 rounded mb-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-400">
                    პასუხი: <span className="text-white">{replyToComment.user.displayName || replyToComment.user.username}</span>
                  </span>
                </div>
                <button
                  onClick={() => setReplyToComment(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyToComment ? "დაწერეთ პასუხი..." : "დაამატეთ კომენტარი..."}
              className="w-full bg-secondary border border-borderGray-dark rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:border-accent placeholder-gray-500 min-h-[60px]"
              rows={2}
              maxLength={500}
            />
            
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-400">
                {commentText.length}/500
              </div>
              
              <button
                onClick={addComment}
                disabled={!commentText.trim() || isSubmitting}
                className={`flex items-center justify-center p-2 rounded-full ${
                  !commentText.trim() || isSubmitting
                    ? 'bg-secondary text-gray-500 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-dark'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* კომენტარების სია */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400">ჯერ არ არის კომენტარები</p>
            <p className="text-gray-500 text-sm mt-1">იყავით პირველი, ვინც დაწერს კომენტარს</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="relative">
              {/* მთავარი კომენტარი */}
              <div className="flex gap-3">
                <Link href={`/${comment.user.username}`} className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <ProfileAvatar
                      imageUrl={comment.user.img}
                      username={comment.user.username}
                      avatarProps={comment.user.avatarProps}
                      size="sm"
                    />
                  </div>
                </Link>
                
                <div className="flex-1">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Link 
                        href={`/${comment.user.username}`}
                        className="font-bold text-white hover:underline"
                      >
                        {comment.user.displayName || comment.user.username}
                      </Link>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimeAgo(new Date(comment.createdAt))}
                        </span>
                        
                        <button className="text-gray-400 hover:text-white p-1">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <FormattedText text={comment.content} />
                  </div>
                  
                  {/* ქმედებების ღილაკები */}
                  <div className="flex items-center gap-4 mt-1 ml-1">
                    {/* მოწონება */}
                    <button
                      onClick={() => likeComment(comment)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Heart
                        size={16}
                        className={comment.likes.length > 0 ? "text-accent" : ""}
                        fill={comment.likes.length > 0 ? "#ff0033" : "none"}
                      />
                      <span className="text-xs">
                        {comment._count.likes > 0 && comment._count.likes}
                      </span>
                    </button>
                    
                    {/* პასუხი */}
                    <button
                      onClick={() => setReplyToComment(comment)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span className="text-xs">პასუხი</span>
                    </button>
                  </div>
                  
                  {/* პასუხების გახსნა/დახურვა */}
                  {comment._count.replies > 0 && !comment.replies && (
                    <button
                      onClick={() => loadReplies(comment)}
                      className="text-accent text-xs hover:underline mt-2 ml-1"
                    >
                      ნახეთ {comment._count.replies} პასუხი
                    </button>
                  )}
                  
                  {/* პასუხების ჩვენება */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-2 border-l-2 border-secondary-light">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="mt-2">
                          <div className="flex gap-2">
                            <Link href={`/${reply.user.username}`} className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full overflow-hidden">
                                <ProfileAvatar
                                  imageUrl={reply.user.img}
                                  username={reply.user.username}
                                  avatarProps={reply.user.avatarProps}
                                  size="sm" // შევცვალეთ "xs" ზომა "sm"-ით
                                />
                              </div>
                            </Link>
                            
                            <div className="flex-1">
                              <div className="bg-secondary-light rounded-lg p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <Link 
                                    href={`/${reply.user.username}`}
                                    className="font-bold text-white hover:underline text-sm"
                                  >
                                    {reply.user.displayName || reply.user.username}
                                  </Link>
                                  
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-400 text-xs flex items-center gap-0.5">
                                      <Clock size={10} />
                                      {formatTimeAgo(new Date(reply.createdAt))}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-sm">
                                  <FormattedText text={reply.content} />
                                </div>
                              </div>
                              
                              {/* ქმედებების ღილაკები პასუხებისთვის */}
                              <div className="flex items-center gap-3 mt-1 ml-1">
                                {/* მოწონება */}
                                <button
                                  onClick={() => likeComment(reply)}
                                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                >
                                  <Heart
                                    size={14}
                                    className={reply.likes.length > 0 ? "text-accent" : ""}
                                    fill={reply.likes.length > 0 ? "#ff0033" : "none"}
                                  />
                                  <span className="text-xs">
                                    {reply._count.likes > 0 && reply._count.likes}
                                  </span>
                                </button>
                                
                                {/* პასუხი */}
                                <button
                                  onClick={() => setReplyToComment(comment)}
                                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                >
                                  <span className="text-xs">პასუხი</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* მეტის ჩატვირთვის ინდიკატორი */}
        {hasMore && (
          <div 
            ref={bottomRef}
            className="text-center py-4"
          >
            {isFetchingMore ? (
              <div className="w-6 h-6 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <button
                onClick={loadMoreComments}
                className="px-4 py-1 bg-secondary hover:bg-secondary-light text-white rounded-full text-sm transition-colors"
              >
                მეტის ჩატვირთვა
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelComments;