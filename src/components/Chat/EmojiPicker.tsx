"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from '../Image';

// დინამიურად ვტვირთავთ EmojiPicker კომპონენტს, რადგან ის მხოლოდ კლიენტის მხარეს მუშაობს
const Picker = dynamic(() => import('emoji-picker-react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-2 text-center">იტვირთება...</div>
});

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void;
};

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
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
        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        <Image path="icons/emoji.svg" alt="ემოჯი" w={20} h={20} className="cursor-pointer" />
      </button>

      {showPicker && (
        <div className="absolute bottom-12 right-0 z-10">
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

export default EmojiPicker;