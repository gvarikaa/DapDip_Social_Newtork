"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Smile } from 'lucide-react';

// დინამიურად ვტვირთავთ EmojiPicker კომპონენტს, რადგან ის მხოლოდ კლიენტის მხარეს მუშაობს
const Picker = dynamic(() => import('emoji-picker-react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-2 text-center text-gray-400 text-sm">იტვირთება...</div>
});

type PostEmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void;
  buttonClass?: string;
};

const PostEmojiPicker = ({ onEmojiSelect, buttonClass = "" }: PostEmojiPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // ვამოწმებთ კლიკებს picker-ის გარეთ, რომ დავხუროთ ის
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`flex items-center justify-center px-3 py-2 bg-secondary hover:bg-secondary-light rounded-lg text-gray-300 hover:text-white transition-colors text-sm ${buttonClass}`}
        title="ემოჯის დამატება"
      >
        <Smile className="w-5 h-5" />
      </button>

      {showPicker && (
        <div className="absolute bottom-12 right-0 z-50">
          <Picker
            onEmojiClick={(emojiData) => {
              onEmojiSelect(emojiData.emoji);
              setShowPicker(false);
            }}
            searchPlaceholder="მოძებნეთ ემოჯი..."
            previewConfig={{ showPreview: false }}
            width={300}
            height={400}
            theme="dark"
          />
        </div>
      )}
    </div>
  );
};

export default PostEmojiPicker;