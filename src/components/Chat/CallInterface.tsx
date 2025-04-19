"use client";

import { useEffect, useState, useRef } from "react";
import Image from "../Image";
import { socket } from "@/socket";
import { useUser } from "@clerk/nextjs";

interface CallInterfaceProps {
  isActive: boolean;
  callType: "audio" | "video";
  receiver: {
    id: string;
    name: string;
    img?: string | null;
  };
  onEndCall: () => void;
}

const CallInterface = ({ isActive, callType, receiver, onEndCall }: CallInterfaceProps) => {
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user } = useUser();

  // ეფექტი ზარის დაწყებისას
  useEffect(() => {
    if (isActive) {
      // ვიდეო ზარის შემთხვევაში გავხსნათ კამერა
      if (callType === "video") {
        startLocalVideo();
      }
      
      // ზარის სტატუსის სიმულაცია (რეალურ აპლიკაციაში აქ იქნებოდა WebRTC ლოგიკა)
      const connectionTimer = setTimeout(() => {
        setCallStatus("connected");
        
        // დავიწყოთ ზარის ხანგრძლივობის ათვლა
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }, 3000);
      
      return () => {
        clearTimeout(connectionTimer);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isActive, callType]);

  // ადგილობრივი ვიდეოს დაწყება
  const startLocalVideo = async () => {
    try {
      if (localVideoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("კამერის წვდომის შეცდომა:", error);
      setIsVideoEnabled(false);
    }
  };

  // ზარის დასრულება
  const handleEndCall = () => {
    setCallStatus("ended");
    
    // გავასუფთაოთ ვიდეო სტრიმები
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // გავასუფთაოთ ტაიმერი
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    onEndCall();
  };

  // მიკროფონის ჩართვა/გამორთვა
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // რეალურ აპლიკაციაში აქ იქნებოდა აუდიო ტრეკების მუტირება
  };

  // ვიდეოს ჩართვა/გამორთვა
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    // რეალურ აპლიკაციაში აქ იქნებოდა ვიდეო ტრეკების ჩართვა/გამორთვა
  };

  // დინამიკის ჩართვა/გამორთვა
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    
    // რეალურ აპლიკაციაში აქ იქნებოდა აუდიოს გამართვა
  };

  // ზარის ხანგრძლივობის ფორმატირება
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // თუ ზარი არ არის აქტიური, არაფერი არ გამოჩნდეს
  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      {/* ზარის სტატუსი და ხანგრძლივობა */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold mb-2">{receiver.name}</h2>
        <p className="text-gray-400">
          {callStatus === "calling" 
            ? "რეკავს..." 
            : callStatus === "connected" 
              ? formatDuration(callDuration)
              : "ზარი დასრულდა"}
        </p>
      </div>
      
      {/* ვიდეო ზარის ინტერფეისი */}
      {callType === "video" && (
        <div className="relative w-full max-w-2xl aspect-video bg-gray-800 rounded-lg mb-8 overflow-hidden">
          {/* მთავარი ვიდეო (მოსაუბრის) */}
          {isVideoEnabled ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/placeholder-video.mp4" type="video/mp4" />
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <Image
                  path={receiver.img || "general/noAvatar.png"}
                  alt={receiver.name}
                  w={128}
                  h={128}
                  tr={true}
                />
              </div>
            </div>
          )}
          
          {/* საკუთარი ვიდეო (პატარა ფანჯარა) */}
          {isVideoEnabled && (
            <div className="absolute bottom-4 right-4 w-40 h-24 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}
      
      {/* აუდიო ზარის ინტერფეისი */}
      {callType === "audio" && (
        <div className="mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
            <Image
              path={receiver.img || "general/noAvatar.png"}
              alt={receiver.name}
              w={128}
              h={128}
              tr={true}
            />
          </div>
        </div>
      )}
      
      {/* კონტროლების პანელი */}
      <div className="flex items-center justify-center gap-4 bg-gray-800 p-4 rounded-full">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${
            isMuted ? "bg-red-600" : "bg-gray-700"
          } hover:opacity-90 transition-opacity`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
        
        {callType === "video" && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isVideoEnabled ? "bg-gray-700" : "bg-red-600"
            } hover:opacity-90 transition-opacity`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isVideoEnabled ? (
                <>
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </>
              ) : (
                <>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M13.41 15.41L10 12l-2.74 2.74a2 2 0 0 0 0 2.83L10 20.5l3.41-3.41a2 2 0 0 0 0-2.83"></path>
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                </>
              )}
            </svg>
          </button>
        )}
        
        {callType === "audio" && (
          <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full ${
              isSpeakerOn ? "bg-gray-700" : "bg-gray-600"
            } hover:opacity-90 transition-opacity`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isSpeakerOn ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </>
              )}
            </svg>
          </button>
        )}
        
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 hover:opacity-90 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CallInterface;