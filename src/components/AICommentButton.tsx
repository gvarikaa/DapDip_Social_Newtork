"use client";

import { useState } from "react";
import AICommentDisplay from "./AICommentDisplay";

type AICommentButtonProps = {
  postId: number;
  commentContent: string;
};

type AICommentType = {
  id: number;
  content: string;
  createdAt: string;
};

const AICommentButton = ({ postId, commentContent }: AICommentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [aiComment, setAiComment] = useState<AICommentType | null>(null);
  const [error, setError] = useState("");
  const [showComment, setShowComment] = useState(false);

  const handleGetAIComment = async () => {
    // თუ კომენტარი უკვე ჩატვირთულია, უბრალოდ ვაჩვენოთ/დავმალოთ
    if (aiComment) {
      setShowComment(!showComment);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/ai-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ postId, commentContent })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI კომენტარის მიღება ვერ მოხერხდა");
      }
      
      const data = await response.json();
      setAiComment(data);
      setShowComment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "უცნობი შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1">
      <button
        onClick={handleGetAIComment}
        disabled={loading}
        className={`flex items-center gap-1 ${
          aiComment 
            ? (showComment ? "text-purple-400" : "text-blue-400") 
            : "text-iconBlue"
        } hover:text-blue-400 transition-colors text-sm py-1 rounded-md`}
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
            <span>AI ანალიზი მიმდინარეობს...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16" 
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={aiComment ? "text-purple-400" : ""}
            >
              <path d="M12 2a8 8 0 0 1 8 8v12l-4-4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h8z"></path>
              <path d="M12 6v4"></path>
              <path d="M12 14h.01"></path>
            </svg>
            <span>
              {aiComment 
                ? (showComment ? "დამალვა" : "ნახვა") 
                : "ChatGPT-ის მოსაზრება"}
            </span>
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-900 bg-opacity-20 rounded-md">
          <span>⚠️ </span>
          {error}
        </div>
      )}
      
      {showComment && aiComment && (
        <div className="mt-2 overflow-hidden transition-all duration-300 ease-in-out">
          <AICommentDisplay content={aiComment.content} createdAt={aiComment.createdAt} />
        </div>
      )}
    </div>
  );
};

export default AICommentButton;