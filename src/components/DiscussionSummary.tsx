// src/components/DiscussionSummary.tsx
"use client";

import { useState, useEffect } from "react";

type CommentType = {
  id: number;
  desc: string | null;
  user: {
    username: string;
  };
  _count?: {
    likes: number;
    comments: number;
  };
};

type DiscussionSummaryProps = {
  comments: CommentType[];
  postId: number;
};

const DiscussionSummary = ({ comments, postId }: DiscussionSummaryProps) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  
  // შევამოწმოთ უნდა ვაჩვენოთ თუ არა ღილაკი
  useEffect(() => {
    // კომენტარების რაოდენობის მიხედვით
    if (comments.length >= 5) {
      setShouldShowButton(true);
      return;
    }
    
    // ან კომენტარების შინაარსის სიგრძის მიხედვით
    const totalTextLength = comments.reduce((total, comment) => 
      total + (comment.desc?.length || 0), 0);
    
    // თუ არის 2+ კომენტარი და საერთო ტექსტის სიგრძე აღემატება 500 სიმბოლოს
    if (comments.length >= 2 && totalTextLength > 500) {
      setShouldShowButton(true);
      return;
    }
    
    // ან თუ ერთი გრძელი კომენტარია
    if (comments.length === 1 && (comments[0].desc?.length || 0) > 300) {
      setShouldShowButton(true);
      return;
    }
    
    setShouldShowButton(false);
  }, [comments]);

  // შეჯამების მოთხოვნის ფუნქცია
  const handleGetSummary = async () => {
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ postId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "შეჯამების მიღება ვერ მოხერხდა");
      }
      
      const data = await response.json();
      setSummary(data.summary);
      setShowSummary(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "უცნობი შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  // თუ არ უნდა ვაჩვენოთ ღილაკი, დავაბრუნოთ null
  if (!shouldShowButton) return null;

  return (
    <div className="my-4 border-t border-b border-borderGray py-3">
      <button
        onClick={handleGetSummary}
        disabled={loading}
        className="flex items-center gap-2 text-iconBlue hover:text-blue-400 transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"></div>
            <span>დამუშავება მიმდინარეობს...</span>
          </>
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span>
              {summary 
                ? (showSummary ? "დამალე ანალიზი" : "აჩვენე ანალიზი") 
                : comments.length === 1 
                  ? "გააანალიზე კომენტარი AI-ით" 
                  : `შეაჯამე დისკუსია (${comments.length} კომენტარი)`}
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
      
      {showSummary && summary && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="currentColor"
                viewBox="0 0 16 16"
                className="text-white"
              >
                <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Z"/>
                <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              {comments.length === 1 ? "AI ანალიზი" : "დისკუსიის შეჯამება"}
            </h3>
          </div>
          
          <div className="whitespace-pre-line text-white">
            {summary.split('\n').map((paragraph, index) => (
              <p key={index} className="my-2">{paragraph}</p>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-blue-300 italic">
            ეს {comments.length === 1 ? "ანალიზი" : "შეჯამება"} შექმნილია AI-ის მიერ და შეიძლება არ ასახავდეს {comments.length === 1 ? "კომენტარის" : "დისკუსიის"} ყველა ასპექტს.
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionSummary;