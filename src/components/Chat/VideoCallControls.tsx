"use client";

import { useState } from "react";
import { socket } from "@/socket";

interface VideoCallControlsProps {
  conversationId: string;
  receiverId: string;
  receiverName: string;
}

const VideoCallControls = ({ conversationId, receiverId, receiverName }: VideoCallControlsProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // ზარის დაწყება
  const startCall = (withVideo: boolean) => {
    setIsVideoCall(withVideo);
    setIsCallActive(true);
    
    // გავაგზავნოთ ზარის მოთხოვნა მიმღებთან
    socket.emit("callRequest", {
      conversationId,
      receiverId,
      callType: withVideo ? "video" : "audio"
    });
    
    // რეალურ აპლიკაციაში აქ მოხდებოდა WebRTC-ის ინიციალიზაცია
    console.log(`${withVideo ? "ვიდეო" : "აუდიო"} ზარის დაწყება ${receiverName}-თან`);
  };

  // ზარის დასრულება
  const endCall = () => {
    setIsCallActive(false);
    
    // გავაგზავნოთ ზარის დასრულების შეტყობინება
    socket.emit("endCall", {
      conversationId,
      receiverId
    });
    
    console.log("ზარი დასრულდა");
  };

  // მიკროფონის ჩართვა/გამორთვა
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // ვიდეოს ჩართვა/გამორთვა
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  return (
    <div className="flex items-center gap-3">
      {!isCallActive ? (
        // ზარის ღილაკები (როდესაც ზარი არ არის აქტიური)
        <>
          <button
            onClick={() => startCall(false)}
            className="p-2 rounded-full bg-green-600 hover:bg-green-700 transition-colors"
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
              className="text-white"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
          <button
            onClick={() => startCall(true)}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
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
              className="text-white"
            >
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
        </>
      ) : (
        // აქტიური ზარის კონტროლები
        <>
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full ${
              isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
            } transition-colors`}
            title={isMuted ? "ჩართე მიკროფონი" : "გამორთე მიკროფონი"}
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
              className="text-white"
            >
              {isMuted ? (
                <>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </>
              ) : (
                <>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </>
              )}
            </svg>
          </button>
          
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${
                !isVideoEnabled ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
              } transition-colors`}
              title={isVideoEnabled ? "გამორთე ვიდეო" : "ჩართე ვიდეო"}
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
                className="text-white"
              >
                {!isVideoEnabled ? (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <path d="M13.41 15.41L10 12l-2.74 2.74a2 2 0 0 0 0 2.83L10 20.5l3.41-3.41a2 2 0 0 0 0-2.83"></path>
                  </>
                ) : (
                  <>
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </>
                )}
              </svg>
            </button>
          )}
          
          <button
            onClick={endCall}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="დაასრულე ზარი"
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
              className="text-white"
            >
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default VideoCallControls;