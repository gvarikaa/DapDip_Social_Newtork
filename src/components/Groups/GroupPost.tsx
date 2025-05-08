"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Share2, 
  ChartBar, 
  Sparkles, 
  MoreVertical,
  ThumbsUp,
  MessageCircle,
  Lightbulb,
  Trash,
  Flag
} from "lucide-react";
import ProfileAvatar from "../Avatar/ProfileAvatar";

type GroupPostProps = {
  post: any; // პოსტის დეტალები
  group: any; // ჯგუფის ინფო
  currentUserId?: string; // მიმდინარე მომხმარებლის ID
  onComment?: () => void;
  onShare?: () => void;
  onAnalyze?: () => void;
};

const GroupPost = ({ post, group, currentUserId, onComment, onShare, onAnalyze }: GroupPostProps) => {
  const [showActions, setShowActions] = useState(false);
  
  // გადავამოწმოთ თუ ეს პოსტი არის ქვანტური აზროვნების ჯგუფში და აქვს ანალიზი
  const isQuantumPost = group?.type === "quantum" && post?.analysis;
  
  // აქვს თუ არა მიმდინარე მომხმარებელს უფლება წაშალოს პოსტი
  const canDelete = currentUserId === post.authorId || 
                   group?.members?.some((m: any) => 
                     m.userId === currentUserId && 
                     (m.role === "admin" || m.role === "moderator"));
  
  return (
    <div className="bg-secondary-dark rounded-lg p-4 border border-borderGray-dark hover:border-borderGray transition-colors relative">
      {/* პოსტის ზედა ნაწილი - ავტორი და ქმედებების მენიუ */}
      <div className="flex justify-between items-start mb-3">
        {/* ავტორის ინფო */}
        <div className="flex gap-3">
          <ProfileAvatar
            imageUrl={post.author.img}
            username={post.author.username}
            avatarProps={post.author.avatarProps}
            gender={post.author.gender}
            size="sm"
          />
          <div>
            <h3 className="text-white font-semibold">
              {post.author.displayName || post.author.username}
            </h3>
            <div className="text-gray-400 text-xs flex items-center">
              <Link href={`/${post.author.username}`} className="hover:underline">
                @{post.author.username}
              </Link>
              <span className="mx-1">·</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              
              {/* ქვანტური აზროვნების ჯგუფებში აჩვენებს დომინანტურ კატეგორიას */}
              {isQuantumPost && post.analysis.category && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded text-[10px] flex items-center"
                  style={{ backgroundColor: post.analysis.category?.color || "#333" }}
                >
                  <Sparkles className="w-2 h-2 mr-0.5" />
                  {post.analysis.category?.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* ქმედებების მენიუ */}
        <div className="relative">
          <button 
            onClick={() => setShowActions(!showActions)} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-secondary rounded-full"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-1 bg-secondary-dark border border-borderGray-dark rounded-lg shadow-menu z-10 py-1 w-48">
              <button 
                onClick={() => { 
                  onShare && onShare();
                  setShowActions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center text-sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span>გაზიარება</span>
              </button>
              
              {isQuantumPost && (
                <button 
                  onClick={() => { 
                    onAnalyze && onAnalyze();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center text-sm"
                >
                  <ChartBar className="w-4 h-4 mr-2" />
                  <span>ანალიზის ნახვა</span>
                </button>
              )}
              
              <button 
                className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center text-sm text-yellow-500"
              >
                <Flag className="w-4 h-4 mr-2" />
                <span>რეპორტი</span>
              </button>
              
              {canDelete && (
                <button 
                  className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center text-sm text-red-500"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  <span>წაშლა</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* პოსტის შინაარსი */}
      <div className="text-white mb-4 whitespace-pre-wrap">
        {post.content}
      </div>
      
      {/* მედია ფაილები */}
      {post.media && post.media.length > 0 && (
        <div className="mb-4 rounded-lg overflow-hidden">
          {/* ვიზუალური ტიპის მედიის მიხედვით */}
          {post.media[0].type === 'image' ? (
            <img 
              src={post.media[0].url} 
              alt="პოსტის სურათი" 
              className="w-full h-auto max-h-96 object-contain bg-black"
            />
          ) : post.media[0].type === 'video' ? (
            <video 
              src={post.media[0].url} 
              controls 
              className="w-full"
            />
          ) : (
            <div className="bg-secondary p-4 text-white rounded-lg flex items-center">
              <div className="mr-2">📎</div> {post.media[0].url.split('/').pop()}
            </div>
          )}
          
          {/* თუ არის რამდენიმე მედია ფაილი */}
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
          onClick={onComment} 
          className="flex items-center hover:text-white transition-colors"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          {post._count?.comments || 0}
        </button>
        
        <div className="flex gap-4">
          {/* რეაქციის ღილაკი */}
          <button className="flex items-center hover:text-white transition-colors">
            <ThumbsUp className="w-4 h-4 mr-1" />
            {post._count?.reactions || 0}
          </button>
          
          {/* ქვანტური აზროვნების ჯგუფებში საშუალებას აძლევს იხილოს ანალიზი */}
          {group.type === "quantum" && (
            <button 
              onClick={onAnalyze}
              className="flex items-center hover:text-white transition-colors"
            >
              <ChartBar className="w-4 h-4 mr-1" />
              ანალიზი
            </button>
          )}
          
          <button 
            onClick={onShare}
            className="flex items-center hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4 mr-1" />
            გაზიარება
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupPost;