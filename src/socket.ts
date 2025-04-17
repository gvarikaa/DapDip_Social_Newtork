"use client";
import { io } from "socket.io-client";

export const socket = io("http://localhost:3001"); // ან შენი სერვერის URL

// ახალი მესიჯის მიღება
socket.on("newMessage", (message) => {
  console.log("New message:", message);
});
