import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChatBox from "@/components/Chat/ChatBox";
import Link from "next/link";
import Image from "@/components/Image";
import { prisma } from "@/prisma";

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const { userId } = await auth();
  
  // თუ არ არის userId, გადავამისამართოთ
  if (!userId) {
    redirect('/sign-in');
  }
  
  // შევამოწმოთ არის თუ არა მომხმარებელი ამ საუბრის მონაწილე
  // კონვერსაციისა და მისი მონაწილეების მოძიება ერთ მოთხოვნაში
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      participants: {
        some: {
          userId: userId
        }
      }
    },
    include: {
      participants: {
        include: {
          user: true
        }
      }
    }
  });

  // თუ კონვერსაცია არ არსებობს ან მომხმარებელი არ არის მონაწილე, გადავამისამართოთ
  if (!conversation) {
    redirect('/messages');
  }
  
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-borderGray flex items-center gap-4">
        <Link href="/messages">
          <Image path="icons/back.svg" alt="back" w={24} h={24} />
        </Link>
        <h1 className="text-xl font-bold">საუბარი</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatBox conversationId={params.conversationId} />
      </div>
    </div>
  );
}