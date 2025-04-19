"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "../Image";
import VideoCallControls from "./VideoCallControls";
import CallInterface from "./CallInterface";

interface ChatHeaderProps {
  conversationId: string;
  chatName: string;
  chatImage?: string | null;
  isGroup: boolean;
  receiverId: string;
}

const ChatHeader = ({ 
  conversationId, 
  chatName, 
  chatImage, 
  isGroup, 
  receiverId 
}: ChatHeaderProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");

  // ზარის დაწყება
  const startCall = (type: "audio" | "video") => {
    setCallType(type);
    setIsCallActive(true);
  };

  // ზარის დასრულება
  const endCall = () => {
    setIsCallActive(false);
  };

  return (
    <>
      <div className="p-4 border-b border-borderGray flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/messages">
            <Image path="icons/back.svg" alt="back" w={24} h={24} />
          </Link>
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              path={chatImage || "general/noAvatar.png"}
              alt="Chat"
              w={40}
              h={40}
              tr={true}
            />
          </div>
          <h1 className="text-xl font-bold">{chatName}</h1>
        </div>
        
        {/* ვიდეო და აუდიო ზარის ღილაკები */}
        {!isGroup && receiverId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => startCall("audio")}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              title="აუდიო ზარი"
            >
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
            <button
              onClick={() => startCall("video")}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              title="ვიდეო ზარი"
            >
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
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* ზარის ინტერფეისი */}
      {isCallActive && (
        <CallInterface
          isActive={isCallActive}
          callType={callType}
          receiver={{
            id: receiverId,
            name: chatName,
            img: chatImage
          }}
          onEndCall={endCall}
        />
      )}
    </>
  );
};

export default ChatHeader;