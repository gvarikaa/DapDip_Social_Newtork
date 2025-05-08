"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "@/socket";
import { useAuth } from "@/lib/auth";

// სოკეტის კონტექსტის ტიპი
type ChatSocketContextType = {
  isConnected: boolean;
};

// შექმენით კონტექსტი საწყისი მნიშვნელობით
const ChatSocketContext = createContext<ChatSocketContextType>({
  isConnected: false,
});

// ექსპორტირებული ჰუკი კონტექსტის მოსახმარად
export const useChatSocket = () => useContext(ChatSocketContext);

export const ChatSocketProvider = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { dbUser } = useAuth();

  useEffect(() => {
    // სოკეტის დაკავშირების ფუნქცია
    const onConnect = () => {
      console.log("Socket connected!");
      setIsConnected(true);
      
      // მომხმარებლის დამატება, თუ ავტორიზებულია
      if (dbUser) {
        socket.emit("newUser", dbUser.username);
        console.log("User registered:", dbUser.username);
      }
    };

    // გათიშვის ფუნქცია
    const onDisconnect = () => {
      console.log("Socket disconnected!");
      setIsConnected(false);
    };

    // სოკეტის შეცდომის ფუნქცია
    const onError = (error: Error) => {
      console.error("Socket error:", error);
    };

    // მოვუსმინოთ socket-ის მოვლენებს
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    // თუ სოკეტი უკვე დაკავშირებულია
    if (socket.connected && dbUser) {
      socket.emit("newUser", dbUser.username);
    }

    // ალაგება, როცა კომპონენტი გაითიშება
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, [dbUser]);

  return (
    <ChatSocketContext.Provider value={{ isConnected }}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export default ChatSocketProvider;