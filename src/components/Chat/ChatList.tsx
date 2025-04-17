// src/components/Chat/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "../Image";
import { format } from "timeago.js";

type Conversation = {
  id: string;
  participants: string[];
  otherParticipants: string[];
  messages: {
    id: number;
    content: string;
    createdAt: string;
    senderId: string;
  }[];
  updatedAt: string;
};

const ChatList = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations");
        if (!response.ok) throw new Error("სასაუბროების მიღება ვერ მოხერხდა");
        
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error("შეცდომა:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const openChat = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  if (loading) {
    return <div className="p-4">იტვირთება...</div>;
  }

  if (conversations.length === 0) {
    return <div className="p-4">ჯერ არ გაქვთ სასაუბროები</div>;
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="flex items-center gap-3 p-4 border-b border-borderGray hover:bg-[#181818] cursor-pointer"
          onClick={() => openChat(conversation.id)}
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image
              path="general/noAvatar.png"
              alt="Avatar"
              w={48}
              h={48}
              tr={true}
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-bold">
                {conversation.otherParticipants.join(", ")}
              </h3>
              <span className="text-textGray text-sm">
                {format(conversation.updatedAt)}
              </span>
            </div>
            {conversation.messages[0] && (
              <p className="text-textGray truncate">
                {conversation.messages[0].content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;