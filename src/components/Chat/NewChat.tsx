// src/components/Chat/NewChat.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const NewChat = () => {
  const [receiverId, setReceiverId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId.trim() || !user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "გამარჯობა! 👋",
          receiverId,
        }),
      });

      if (!response.ok) throw new Error("საუბრის დაწყება ვერ მოხერხდა");
      
      const message = await response.json();
      router.push(`/messages/${message.conversationId}`);
    } catch (error) {
      console.error("შეცდომა:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">ახალი საუბრის დაწყება</h2>
      <form onSubmit={startConversation} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">მომხმარებლის ID</label>
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="შეიყვანეთ მომხმარებლის ID"
            className="w-full bg-inputGray p-2 rounded-md outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-iconBlue text-white rounded-full px-4 py-2 font-bold w-full disabled:opacity-50"
        >
          {loading ? "იტვირთება..." : "დაწყება"}
        </button>
      </form>
    </div>
  );
};

export default NewChat;