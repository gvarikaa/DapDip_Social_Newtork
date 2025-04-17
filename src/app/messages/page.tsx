// src/app/messages/page.tsx
import { auth } from "@clerk/nextjs/server";
import ChatList from "@/components/Chat/ChatList";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="h-screen">
      <div className="p-4 border-b border-borderGray">
        <h1 className="text-xl font-bold">მესიჯები</h1>
      </div>
      <ChatList />
    </div>
  );
}