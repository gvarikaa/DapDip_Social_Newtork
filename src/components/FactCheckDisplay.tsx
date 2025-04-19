"use client";

import React from 'react';

// ანალიზის შედეგის ტიპი
type AnalysisType = {
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

// პროგრეს ბარის კომპონენტი
const ProgressBar = ({ 
  percentage = 0, 
  label, 
  color = "bg-blue-500" 
}: { 
  percentage?: number, 
  label: string, 
  color?: string 
}) => (
  <div className="flex items-center mb-2">
    <div className="w-24 text-xs text-right pr-2 text-gray-300">{label}</div>
    <div className="flex-1 bg-gray-700 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, percentage || 0))}%` }}
      ></div>
    </div>
    <div className="w-10 text-xs pl-2">{Math.round(percentage || 0)}%</div>
  </div>
);

// მთავარი კომპონენტი
const FactCheckDisplay = ({ analysis }: { analysis: AnalysisType }) => {
  // შევამოწმოთ არის თუ არა analysis ვალიდური
  if (!analysis || !analysis.factCheck || !analysis.tonalAnalysis) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-center text-gray-400">ანალიზის შედეგები ვერ ჩაიტვირთა</p>
      </div>
    );
  }

  // უსაფრთხოდ წავიკითხოთ ანალიზის შედეგები
  const truthScore = analysis.factCheck.truthScore || 0;
  const isFake = analysis.factCheck.isFake || false;
  const explanation = analysis.factCheck.explanation || "";
  const realFacts = analysis.factCheck.realFacts || "";

  const positive = analysis.tonalAnalysis.positive || 0;
  const negative = analysis.tonalAnalysis.negative || 0;
  const neutral = analysis.tonalAnalysis.neutral || 0;
  const aggressive = analysis.tonalAnalysis.aggressive || 0;
  const humorous = analysis.tonalAnalysis.humorous || 0;

  // შევამოწმოთ, არის თუ არა არაფაქტობრივი პოსტი
  const isNotFactual = explanation.includes("არ შეიცავს ფაქტობრივ განცხადებებს");

  // სიმართლის ინდიკატორის ფერი
  const getTruthScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // სიმართლის წრიული ინდიკატორი
  const TruthMeter = ({ score }: { score: number }) => {
    const safeScore = Math.min(100, Math.max(0, score || 0));
    const colorClass = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
    
    return (
      <div className="relative w-28 h-28 mx-auto">
        {/* წრიული ფონი */}
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#444"
            strokeWidth="3"
            strokeDasharray="100, 100"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={colorClass}
            strokeWidth="3"
            strokeDasharray={`${safeScore}, 100`}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        {/* პროცენტის ტექსტი */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{safeScore}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700 shadow-lg transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
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
            className="text-white"
          >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">
          {isNotFactual ? "ტონის ანალიზი" : "ფაქტების ანალიზი"}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* მარცხენა სვეტი - ფაქტების შემოწმება */}
        <div className="flex flex-col items-center">
          <h4 className="text-lg font-semibold mb-2 text-center">
            {isNotFactual 
              ? "ℹ️ არ შეიცავს ფაქტობრივ მტკიცებულებებს" 
              : isFake 
                ? "❌ შესაძლოა ფეიკი" 
                : truthScore >= 80
                  ? "✅ სანდო ინფორმაცია"
                  : "⚠️ ნაწილობრივ სანდო"}
          </h4>
          
          {!isNotFactual && <TruthMeter score={truthScore} />}
          
          <div className="mt-4 text-sm">
            <h5 className="font-semibold mb-1">განმარტება:</h5>
            <p className="text-gray-300 mb-3">{explanation}</p>
            
            {!isNotFactual && isFake && realFacts && (
              <>
                <h5 className="font-semibold mb-1">რეალური ფაქტები:</h5>
                <p className="text-gray-300">{realFacts}</p>
              </>
            )}
          </div>
        </div>
        
        {/* მარჯვენა სვეტი - ტონის ანალიზი */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-center">ტონის ანალიზი</h4>
          
          <div className="space-y-3">
            <ProgressBar 
              percentage={positive} 
              label="პოზიტიური" 
              color="bg-green-500" 
            />
            <ProgressBar 
              percentage={negative} 
              label="ნეგატიური" 
              color="bg-red-500" 
            />
            <ProgressBar 
              percentage={neutral} 
              label="ნეიტრალური" 
              color="bg-blue-400" 
            />
            <ProgressBar 
              percentage={aggressive} 
              label="აგრესიული" 
              color="bg-orange-500" 
            />
            <ProgressBar 
              percentage={humorous} 
              label="იუმორისტული" 
              color="bg-purple-500" 
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-400 italic text-center">
        ეს ანალიზი შექმნილია AI-ის მიერ და არის მხოლოდ საორიენტაციო. ყოველთვის გადაამოწმეთ ინფორმაცია სანდო წყაროებიდან.
      </div>
    </div>
  );
};

export default FactCheckDisplay;