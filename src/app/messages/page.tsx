// src/app/messages/page.tsx
import { auth } from "@clerk/nextjs/server";
import ChatList from "@/components/Chat/ChatList";
import FriendsList from "@/components/Chat/FriendsList";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="h-screen flex">
      {/* მეგობრების სია - მარცხენა მხარეს */}
      <div className="w-1/4 hidden md:block">
        <FriendsList />
      </div>
      
      {/* ჩატების სია - მარჯვენა მხარეს */}
      <div className="flex-1">
        <div className="p-4 border-b border-borderGray">
          <h1 className="text-xl font-bold">მესიჯები</h1>
        </div>
        <ChatList />
      </div>
    </div>
  );
}