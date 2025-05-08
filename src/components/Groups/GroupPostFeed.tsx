"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Share2, ChartBar, ExternalLink, Users, Brain, Wrench, Newspaper } from "lucide-react";
import ProfileAvatar from "../Avatar/ProfileAvatar";

// ჯგუფების ტიპის იკონები
const groupTypeIcons = {
  standard: <Users className="w-3 h-3" />,
  quantum: <Brain className="w-3 h-3" />,
  project: <Wrench className="w-3 h-3" />,
  info: <Newspaper className="w-3 h-3" />
};

type GroupPostFeedProps = {
  groupPosts: any[]; // ჯგუფის პოსტების მასივი
  currentUserId: string; // მიმდინარე მომხმარებლის ID
};

const GroupPostFeed = ({ groupPosts, currentUserId }: GroupPostFeedProps) => {
  const router = useRouter();
  const [activePost, setActivePost] = useState<string | null>(null);

  // კომენტარის ფუნქცია
  const handleComment = (postId: string, groupId: string) => {
    router.push(`/groups/${groupId}/${postId}`);
  };

  // გაზიარების ფუნქცია
  const handleShare = async (postId: string, groupId: string) => {
    try {
      // აქ შეგვიძლია დავამატოთ გაზიარების ლოგიკა
      if (navigator.share) {
        await navigator.share({
          title: "ჯგუფის პოსტის გაზიარება",
          url: `${window.location.origin}/groups/${groupId}/${postId}`,
        });
      } else {
        // თუ navigator.share არ არის ხელმისაწვდომი
        navigator.clipboard.writeText(`${window.location.origin}/groups/${groupId}/${postId}`);
        alert("ბმული დაკოპირებულია!");
      }
    } catch (error) {
      console.error("გაზიარების შეცდომა:", error);
    }
  };

  // ანალიზის ნახვის ფუნქცია
  const handleAnalyze = (postId: string, groupId: string) => {
    router.push(`/groups/${groupId}/${postId}/analyze`);
  };

  // თუ პოსტები არ არის, ან ცარიელი მასივია, ან თუ API შეცდომას აბრუნებს
  if (!groupPosts || groupPosts.length === 0 || !Array.isArray(groupPosts)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {groupPosts.map((post) => {
        // თუ პოსტი არავალიდურია, გამოვტოვოთ
        if (!post || !post.group) {
          return null;
        }
        
        // შევამოწმოთ არის თუ არა ეს ქვანტური აზროვნების ჯგუფის პოსტი და აქვს თუ არა ანალიზი
        const isQuantumPost = post.group?.type === "quantum" && post.analysis;

        return (
          <div 
            key={post.id} 
            className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark hover:border-borderGray transition-colors"
          >
            {/* ჯგუფის ინფორმაცია */}
            <div className="mb-2 flex items-center">
              <Link 
                href={`/groups/${post.group.id}`}
                className="flex items-center text-gray-300 hover:text-white text-sm group"
              >
                <div className="w-5 h-5 mr-1.5 bg-primary rounded-md flex items-center justify-center text-white">
                  {post.group.icon ? (
                    <span>{post.group.icon}</span>
                  ) : (
                    (post.group.type && groupTypeIcons[post.group.type as keyof typeof groupTypeIcons]) || <Users className="w-3 h-3" />
                  )}
                </div>
                <span className="group-hover:underline">{post.group.name || "ჯგუფი"}</span>
                <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
              </Link>
            </div>
            
            {/* ავტორის ინფო */}
            <div className="flex gap-3 mb-3">
              <ProfileAvatar
                imageUrl={post.author?.img || ""}
                username={post.author?.username || "user"}
                avatarProps={post.author?.avatarProps}
                gender={post.author?.gender}
                size="sm"
              />
              <div>
                <h3 className="text-white font-semibold">
                  {post.author?.displayName || post.author?.username || "მომხმარებელი"}
                </h3>
                <div className="text-gray-400 text-xs flex items-center flex-wrap">
                  {post.author?.username && (
                    <>
                      <Link href={`/${post.author.username}`} className="hover:underline">
                        @{post.author.username}
                      </Link>
                      <span className="mx-1">·</span>
                    </>
                  )}
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  
                  {/* ქვანტური აზროვნების ჯგუფებში აჩვენებს დომინანტურ კატეგორიას */}
                  {isQuantumPost && post.analysis?.category && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded text-[10px] flex items-center"
                      style={{ backgroundColor: post.analysis.category?.color || "#333" }}
                    >
                      {post.analysis.category?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* პოსტის შინაარსი - შეზღუდული, სრული ტექსტის სანახავად ჯგუფში გადასვლა */}
            <div className="text-white mb-4 whitespace-pre-wrap">
              {post.content?.length > 300 
                ? `${post.content.substring(0, 300)}...` 
                : post.content}
                
              {post.content?.length > 300 && (
                <Link 
                  href={`/groups/${post.group.id}/${post.id}`}
                  className="text-primary hover:underline ml-1 text-sm"
                >
                  მეტის ნახვა
                </Link>
              )}
            </div>
            
            {/* მედია ფაილები */}
            {post.media && post.media.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden">
                {post.media[0].type === 'image' ? (
                  <img 
                    src={post.media[0].url} 
                    alt="პოსტის სურათი" 
                    className="w-full h-auto max-h-80 object-contain bg-black"
                  />
                ) : post.media[0].type === 'video' ? (
                  <video 
                    src={post.media[0].url} 
                    controls 
                    className="w-full"
                  />
                ) : (
                  <div className="bg-secondary p-3 text-white rounded-lg flex items-center">
                    <div className="mr-2">📎</div> {post.media[0].url.split('/').pop()}
                  </div>
                )}
                
                {post.media.length > 1 && (
                  <div className="mt-1 text-xs text-gray-400">
                    +{post.media.length - 1} მეტი მედია ფაილი
                  </div>
                )}
              </div>
            )}
            
            {/* ინტერაქციის ღილაკები */}
            <div className="flex justify-between text-gray-400 text-sm">
              <button 
                onClick={() => handleComment(post.id, post.group.id)} 
                className="flex items-center hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {post._count?.comments || 0}
              </button>
              
              <div className="flex gap-4">
                {/* ქვანტური აზროვნების ჯგუფებში საშუალებას აძლევს იხილოს ანალიზი */}
                {post.group.type === "quantum" && post.analysis && (
                  <button 
                    onClick={() => handleAnalyze(post.id, post.group.id)}
                    className="flex items-center hover:text-white transition-colors"
                  >
                    <ChartBar className="w-4 h-4 mr-1" />
                    ანალიზი
                  </button>
                )}
                
                <button 
                  onClick={() => handleShare(post.id, post.group.id)}
                  className="flex items-center hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  გაზიარება
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* სრული ჯგუფების სანახავი ლინკი */}
      <div className="flex justify-center mt-2 mb-6">
        <Link 
          href="/groups" 
          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm transition-colors"
        >
          ყველა ჯგუფის ნახვა
        </Link>
      </div>
    </div>
  );
};

export default GroupPostFeed;