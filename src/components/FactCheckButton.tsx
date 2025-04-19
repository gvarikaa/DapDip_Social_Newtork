"use client";

import { useState } from "react";
import FactCheckDisplay from "./FactCheckDisplay";

type FactCheckButtonProps = {
  postId: number;
  postContent: string;
};

type AnalysisResultType = {
  factCheck?: {
    truthScore?: number;
    isFake?: boolean;
    explanation?: string;
    realFacts?: string;
  };
  tonalAnalysis?: {
    negative?: number;
    positive?: number;
    neutral?: number;
    aggressive?: number;
    humorous?: number;
  };
};

const FactCheckButton = ({ postId, postContent }: FactCheckButtonProps) => {
  // თუ პოსტი ძალიან მოკლეა, არ ვაჩვენოთ ღილაკი
  if (postContent.length < 15) {
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResultType | null>(null);
  const [error, setError] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleFactCheck = async () => {
    // თუ ანალიზი უკვე ჩატვირთულია, უბრალოდ ვაჩვენოთ/დავმალოთ
    if (analysis) {
      setShowAnalysis(!showAnalysis);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // ჯერ შევამოწმოთ, არსებობს თუ არა უკვე ანალიზი
      const checkResponse = await fetch(`/api/post-analysis?postId=${postId}`);
      const checkData = await checkResponse.json();
      
      if (checkData.found && checkData.analysis) {
        setAnalysis(checkData.analysis);
        setShowAnalysis(true);
        setLoading(false);
        return;
      }
      
      // თუ არ არსებობს, მოვითხოვოთ ახალი ანალიზი
      const response = await fetch("/api/post-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ postId, postContent })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ფაქტების შემოწმება ვერ მოხერხდა");
      }
      
      const data = await response.json();
      setAnalysis(data);
      setShowAnalysis(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "უცნობი შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  // ღილაკის ტექსტის განსაზღვრა ანალიზის შედეგების მიხედვით
  const getButtonText = () => {
    if (loading) return "ანალიზი მიმდინარეობს...";
    
    if (!analysis) return "შეამოწმე ტექსტი";
    
    // არის თუ არა არაფაქტობრივი პოსტი
    const isNotFactual = analysis.factCheck?.explanation?.includes("არ შეიცავს ფაქტობრივ განცხადებებს");
    
    if (!showAnalysis) return isNotFactual ? "აჩვენე ტონი" : "აჩვენე ანალიზი";
    
    return "დამალე ანალიზი";
  };

  // ღილაკის ფერი ანალიზის შედეგების მიხედვით
  const getButtonColor = () => {
    if (!analysis || !analysis.factCheck) return "text-yellow-500 hover:text-yellow-400";
    
    // არის თუ არა არაფაქტობრივი პოსტი
    const isNotFactual = analysis.factCheck.explanation?.includes("არ შეიცავს ფაქტობრივ განცხადებებს");
    if (isNotFactual) return "text-blue-500 hover:text-blue-400";
    
    if (analysis.factCheck.isFake) {
      return "text-red-500 hover:text-red-400";
    }
    
    if (analysis.factCheck.truthScore && analysis.factCheck.truthScore > 80) {
      return "text-green-500 hover:text-green-400";
    }
    
    return "text-yellow-500 hover:text-yellow-400";
  };

  // ღილაკის აიქონი ანალიზის შედეგების მიხედვით
  const getButtonIcon = () => {
    if (!analysis || !analysis.factCheck) {
      return (
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
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
        </svg>
      );
    }

    // არის თუ არა არაფაქტობრივი პოსტი
    const isNotFactual = analysis.factCheck.explanation?.includes("არ შეიცავს ფაქტობრივ განცხადებებს");
    
    if (isNotFactual) {
      return (
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
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      );
    }
    
    if (analysis.factCheck.isFake) {
      return (
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
        >
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      );
    }
    
    if (analysis.factCheck.truthScore && analysis.factCheck.truthScore > 80) {
      return (
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
        >
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
      );
    }
    
    return (
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
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    );
  };

  return (
    <div className="mt-1">
      <button
        onClick={handleFactCheck}
        disabled={loading}
        className={`flex items-center gap-1 ${getButtonColor()} transition-colors text-sm py-1 rounded-md`}
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
            <span>{getButtonText()}</span>
          </>
        ) : (
          <>
            {getButtonIcon()}
            <span>{getButtonText()}</span>
            
            {analysis && analysis.factCheck && analysis.factCheck.truthScore !== undefined && !loading && !analysis.factCheck.explanation?.includes("არ შეიცავს ფაქტობრივ განცხადებებს") && (
              <span className="ml-1 font-bold">
                {analysis.factCheck.truthScore}%
              </span>
            )}
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-900 bg-opacity-20 rounded-md">
          <span>⚠️ </span>
          {error}
        </div>
      )}
      
      {showAnalysis && analysis && (
        <div className="mt-2 overflow-hidden transition-all duration-300 ease-in-out">
          <FactCheckDisplay analysis={analysis} />
        </div>
      )}
    </div>
  );
};

export default FactCheckButton;