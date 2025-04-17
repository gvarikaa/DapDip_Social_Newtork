// src/components/Chat/ChatBox.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { socket } from "@/socket";
import Image from "../Image";
import { format } from "timeago.js";

type Message = {
  id: number;
  content: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
};

const ChatBox = ({ conversationId }: { conversationId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Socket.io მოსმენა ახალი მესიჯებისთვის
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          conversationId,
        }),
      });

      if (!response.ok) throw new Error("მესიჯის გაგზავნა ვერ მოხერხდა");
      
      const message = await response.json();
      
      // გამოვაგზავნოთ მესიჯი socket-ის გამოყენებით
      socket.emit("sendMessage", message);
      
      setNewMessage("");
    } catch (error) {
      console.error("შეცდომა:", error);
    }
  };

  if (loading) {
    return <div className="p-4">იტვირთება...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
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
              <p>{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {format(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={sendMessage}
        className="border-t border-borderGray p-4 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="დაწერეთ მესიჯი..."
          className="flex-1 bg-inputGray p-2 rounded-full outline-none"
        />
        <button
          type="submit"
          className="bg-iconBlue text-white rounded-full px-4 font-bold"
        >
          გაგზავნა
        </button>
      </form>
    </div>
  );
};

export default ChatBox;