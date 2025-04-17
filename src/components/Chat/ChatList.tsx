// src/components/Chat/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "../Image";
import { format } from "timeago.js";
import { socket } from "@/socket";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type ConversationParticipant = {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    img: string | null;
  };
};

type Conversation = {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: {
    id: number;
    content: string;
    createdAt: string;
    senderId: string;
  }[];
};

const ChatList = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();

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

    // ახალი მესიჯის მოსვლისას განვაახლოთ საუბრები
    const handleNewMessage = (message: any) => {
      setConversations(prevConversations => {
        return prevConversations.map(conversation => {
          if (conversation.id === message.conversationId) {
            // განვაახლოთ ბოლო მესიჯი და დათარიღება
            return {
              ...conversation,
              messages: [message],
              updatedAt: message.createdAt
            };
          }
          return conversation;
        });
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  const openChat = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup && conversation.name) {
      return conversation.name;
    }
    
    // პირადი საუბრისთვის ვიპოვოთ მეორე მონაწილე
    const otherParticipant = conversation.participants.find(
      p => p.userId !== user?.id
    );
    
    if (otherParticipant && otherParticipant.user) {
      return otherParticipant.user.displayName || otherParticipant.user.username;
    }
    
    return "უცნობი საუბარი";
  };

  const getConversationImage = (conversation: Conversation) => {
    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== user?.id
      );
      
      if (otherParticipant && otherParticipant.user && otherParticipant.user.img) {
        return otherParticipant.user.img;
      }
    }
    
    return "general/noAvatar.png";
  };

  if (loading) {
    return <div className="p-4">იტვირთება...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-64">
        <p className="text-center mb-4">ჯერ არ გაქვთ სასაუბროები</p>
        <Link 
          href="/messages/new" 
          className="bg-iconBlue text-white rounded-full px-4 py-2 font-bold"
        >
          დაიწყეთ ახალი საუბარი
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Link 
        href="/messages/new" 
        className="bg-iconBlue text-white m-4 p-2 rounded-full text-center font-bold"
      >
        ახალი საუბარი
      </Link>
      
      {conversations
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((conversation) => (
        <div
          key={conversation.id}
          className="flex items-center gap-3 p-4 border-b border-borderGray hover:bg-[#181818] cursor-pointer"
          onClick={() => openChat(conversation.id)}
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image
              path={getConversationImage(conversation)}
              alt="Avatar"
              w={48}
              h={48}
              tr={true}
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-bold">
                {getConversationName(conversation)}
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