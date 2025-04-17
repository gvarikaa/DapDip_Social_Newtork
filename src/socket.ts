"use client";
import { io } from "socket.io-client";

// გამოვიყენებთ იმავე ჰოსტს და პორტს, რაზეც Next.js სერვერი მუშაობს
export const socket = io("http://localhost:3000", {
  reconnectionDelayMax: 10000,
  autoConnect: true
});

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

export default socket;