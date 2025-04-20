"use client";
import { io } from "socket.io-client";

// დინამიურად განვსაზღვროთ სოკეტის URL
const socketUrl = typeof window !== "undefined" 
  ? window.location.origin 
  : "http://localhost:3000";

export const socket = io(socketUrl, {
  reconnectionDelayMax: 10000,
  autoConnect: true
});

// ზარის მოთხოვნის ტიპი
export type CallRequestType = {
  conversationId: string;
  receiverId: string;
  callType: "audio" | "video";
};

// ზარის პასუხის ტიპი
export type CallResponseType = {
  conversationId: string;
  accepted: boolean;
  callerId: string;
};

// ონლაინ სტატუსის ცვლილების ტიპი
export type UserStatusChangeType = {
  userId: string;
  isOnline: boolean;
};

// დიაგნოსტიკური ლოგები
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

// მეთოდები ზარების გასაგზავნად
export const socketMethods = {
  // ზარის მოთხოვნის გაგზავნა
  sendCallRequest: (data: CallRequestType) => {
    socket.emit("callRequest", data);
  },
  
  // ზარზე პასუხის გაგზავნა
  sendCallResponse: (data: CallResponseType) => {
    socket.emit("callResponse", data);
  },
  
  // ზარის დასრულების სიგნალი
  endCall: (conversationId: string, receiverId: string) => {
    socket.emit("endCall", { conversationId, receiverId });
  },
  
  // ონლაინ სტატუსის განახლება
  updateStatus: (isOnline: boolean) => {
    socket.emit("updateStatus", { isOnline });
  },
  
  // ოთახში შესვლა კონკრეტული საუბრისთვის
  joinRoom: (conversationId: string) => {
    socket.emit("joinRoom", conversationId);
  },
  
  // ოთახიდან გასვლა
  leaveRoom: (conversationId: string) => {
    socket.emit("leaveRoom", conversationId);
  }
};

export default socket;