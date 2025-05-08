"use client";

import { useState, useEffect } from 'react';

type FormattedTextProps = {
  text: string;
  maxLength?: number;
};

const FormattedText: React.FC<FormattedTextProps> = ({ 
  text, 
  maxLength = 250 // ნაგულისხმევად 250 სიმბოლო
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  
  useEffect(() => {
    // ვამოწმებთ უნდა მოხდეს თუ არა ტექსტის შემოკლება
    setShouldTruncate(text.length > maxLength);
  }, [text, maxLength]);

  if (!text) return null;

  // რეგულარული გამოსახულება ჰეშთეგების ამოსაცნობად
  const hashtagRegex = /#([\wა-ჰ]+)/g;
  
  // URL-ების ამოსაცნობი რეგულარული გამოსახულება
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // ტექსტის დაყოფა ნაწილებად და ჰეშთეგების/ბმულების დამუშავება
  const renderFormattedText = () => {
    // განვსაზღვროთ რა ტექსტი უნდა გამოვიტანოთ
    const displayText = shouldTruncate && !isExpanded 
      ? text.substring(0, maxLength) + '...' 
      : text;
    
    // ვაერთიანებთ ორივე რეგულარულ გამოსახულებას
    const combinedRegex = new RegExp(`${hashtagRegex.source}|${urlRegex.source}`, 'g');
    
    // ვყოფთ ტექსტს ნაწილებად
    const parts = displayText.split(combinedRegex);
    
    // ვპოულობთ ყველა მატჩს
    const matches = displayText.match(combinedRegex) || [];
    
    // შედეგი: ნაწილები, რომლებიც განსხვავებულად გამოისახება
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      // ვამატებთ ჩვეულებრივ ტექსტს
      if (parts[i]) {
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }
      
      // ვამატებთ მატჩს (ჰეშთეგს ან URL-ს), თუ არსებობს
      if (matches[i]) {
        if (matches[i].startsWith('#')) {
          const hashtag = matches[i].substring(1); // ვაშორებთ # სიმბოლოს
          result.push(
            <a 
              key={`hashtag-${i}`} 
              href={`/hashtag/${hashtag.toLowerCase()}`} 
              className="text-iconBlue hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {matches[i]}
            </a>
          );
        } else if (matches[i].match(urlRegex)) {
          result.push(
            <a 
              key={`url-${i}`} 
              href={matches[i]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-iconBlue hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {matches[i]}
            </a>
          );
        } else {
          result.push(<span key={`other-${i}`}>{matches[i]}</span>);
        }
      }
    }
    
    return result;
  };

  return (
    <div className="text-[#f1f1f1] whitespace-pre-line">
      {renderFormattedText()}
      
      {/* "See More" / "See Less" ღილაკი მხოლოდ მაშინ, როცა საჭიროა */}
      {shouldTruncate && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-iconBlue hover:underline mt-1 text-sm font-medium"
        >
          {isExpanded ? 'See Less' : 'See More'}
        </button>
      )}
    </div>
  );
};

export default FormattedText;