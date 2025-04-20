// src/app/messages/new/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewChat from "@/components/Chat/NewChat";
import Link from "next/link";
import Image from "@/components/CustomImage";

export default async function NewMessagePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="h-screen">
      <div className="p-4 border-b border-borderGray flex items-center gap-4">
        <Link href="/messages">
          <Image path="icons/back.svg" alt="back" w={24} h={24} />
        </Link>
        <h1 className="text-xl font-bold">ახალი საუბარი</h1>
      </div>
      <NewChat />
    </div>
  );
}