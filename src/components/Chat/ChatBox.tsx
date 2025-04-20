// src/components/Chat/ChatBox.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { socket } from "@/socket";
import Image from "../CustomImage";
import { format } from "timeago.js";
import EmojiPicker from "./EmojiPicker";
import FileUpload from "./FileUpload";

type Message = {
  id: number;
  content: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  attachmentUrl: string | null;
  attachmentType: string | null;
  sender?: {
    username: string;
    displayName: string | null;
    img: string | null;
  };
};

const ChatBox = ({ conversationId }: { conversationId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ახალი მესიჯის მოსვლის ჰენდლერი
  const handleNewMessage = (message: Message) => {
    console.log("Received new message:", message);
    if (message.conversationId === conversationId) {
      setMessages((prev) => {
        // შევამოწმოთ, არსებობს თუ არა უკვე ეს მესიჯი მასივში
        const exists = prev.some(msg => msg.id === message.id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?conversationId=${conversationId}`);
        if (!response.ok) throw new Error("მესიჯების მიღება ვერ მოხერხდა");
        
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("შეცდომა:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // მოვემზადოთ მესიჯების მოსასმენად
    socket.on("newMessage", handleNewMessage);
    
    // შევუერთდეთ საუბრის ოთახს 
    socket.emit("joinRoom", conversationId);
    
    return () => {
      // დავასუფთავოთ როცა კომპონენტი გაითიშება
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveRoom", conversationId);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    // ფოკუსი დავაბრუნოთ შეყვანის ველზე
    inputRef.current?.focus();
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // შევამოწმოთ არის თუ არა ტექსტი ან ფაილი
    if ((!newMessage.trim() && !selectedFile) || !user || isSending) return;

    try {
      setIsSending(true);
      
      let response;
      
      if (selectedFile) {
        // თუ გვაქვს ფაილი, ვიყენებთ FormData-ს
        const formData = new FormData();
        formData.append("content", newMessage);
        formData.append("conversationId", conversationId);
        formData.append("file", selectedFile);
        
        response = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });
      } else {
        // სტანდარტული JSON მოთხოვნა
        response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage,
            conversationId,
          }),
        });
      }

      if (!response.ok) throw new Error("მესიჯის გაგზავნა ვერ მოხერხდა");
      
      const message = await response.json();
      console.log("Message sent:", message);
      
      // დავამატოთ მესიჯი ლოკალურად (ოპტიმისტური განახლება)
      setMessages(prev => [...prev, message]);
      
      // გამოვაგზავნოთ მესიჯი socket-ის გამოყენებით
      socket.emit("sendMessage", message);
      
      // გავასუფთაოთ ინფუთი და ფაილი
      setNewMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("შეცდომა:", error);
    } finally {
      setIsSending(false);
    }
  };

  // ფაილის ტიპის მიხედვით რენდერინგი
  const renderAttachment = (message: Message) => {
    if (!message.attachmentUrl) return null;
    
    switch (message.attachmentType) {
      case 'image':
        return (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
            <img 
              src={message.attachmentUrl} 
              alt="სურათი" 
              className="max-w-full max-h-60 rounded-md object-contain"
            />
          </a>
        );
      case 'pdf':
        return (
          <a 
            href={message.attachmentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 bg-black bg-opacity-30 p-2 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>PDF ფაილი</span>
          </a>
        );
      default:
        return (
          <a 
            href={message.attachmentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 bg-black bg-opacity-30 p-2 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            <span>ფაილი</span>
          </a>
        );
    }
  };
  
  if (loading) {
    return <div className="p-4">იტვირთება...</div>;
  }
  
  // ფაილის ტიპის მიმართულების რენდერი
  const renderFilePreview = () => {
    if (!selectedFile) return null;
    
    const isImage = selectedFile.type.includes('image');
    
    return (
      <div className="mx-4 mb-2 p-2 bg-[#1e2732] rounded-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isImage ? (
            <div className="w-10 h-10 overflow-hidden rounded-md">
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="ატვირთული სურათი" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          )}
          <div className="text-sm truncate max-w-[150px]">{selectedFile.name}</div>
        </div>
        <button 
          type="button" 
          onClick={removeFile}
          className="text-gray-400 hover:text-white p-1"
        >
          &times;
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-textGray text-center">
              ჯერ არ არის მესიჯები. დაიწყეთ საუბარი!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.senderId === user?.id
                    ? "bg-iconBlue text-white"
                    : "bg-[#2f3336] text-white"
                }`}
              >
                {message.content && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
                {renderAttachment(message)}
                <p className="text-xs opacity-70 mt-1">
                  {format(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {renderFilePreview()}
      <form
        onSubmit={sendMessage}
        className="border-t border-borderGray p-4 flex gap-2 items-center"
      >
        <div className="flex items-center bg-inputGray rounded-full flex-1 pr-4">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? "დაამატეთ აღწერა (არაა აუცილებელი)" : "დაწერეთ მესიჯი..."}
            className="flex-1 bg-transparent p-2 px-4 outline-none rounded-full"
          />
          <div className="flex items-center">
            <FileUpload onFileSelect={handleFileSelect} />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSending || (!newMessage.trim() && !selectedFile)}
          className="bg-iconBlue text-white rounded-full px-4 py-2 font-bold disabled:opacity-50"
        >
          {isSending ? "..." : "გაგზავნა"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;