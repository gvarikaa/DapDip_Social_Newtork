import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChatBox from "@/components/Chat/ChatBox";
import Link from "next/link";
import Image from "@/components/Image";
import { prisma } from "@/prisma";
import ConversationParticipants from "@/components/Chat/ConversationParticipants";

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
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              img: true
            }
          }
        }
      }
    }
  });

  // თუ კონვერსაცია არ არსებობს ან მომხმარებელი არ არის მონაწილე, გადავამისამართოთ
  if (!conversation) {
    redirect('/messages');
  }
  
  // მივიღოთ საუბრის სახელი:
  // - ჯგუფებისთვის გამოვიყენოთ კონვერსაციის სახელი
  // - პირადი საუბრებისთვის გამოვიყენოთ მეორე მონაწილის სახელი
  let chatName = conversation.name;
  let chatImage = null;
  
  if (!conversation.isGroup) {
    // პირადი საუბრისთვის ვიპოვოთ მეორე მონაწილე
    const otherParticipant = conversation.participants.find(
      p => p.userId !== userId
    );
    
    if (otherParticipant && otherParticipant.user) {
      chatName = otherParticipant.user.displayName || otherParticipant.user.username;
      chatImage = otherParticipant.user.img;
    }
  }
  
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-borderGray flex items-center gap-4">
        <Link href="/messages">
          <Image path="icons/back.svg" alt="back" w={24} h={24} />
        </Link>
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <Image
            path={chatImage || "general/noAvatar.png"}
            alt="Chat"
            w={40}
            h={40}
            tr={true}
          />
        </div>
        <h1 className="text-xl font-bold">{chatName}</h1>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ChatBox conversationId={params.conversationId} />
        </div>
        <ConversationParticipants 
          participants={conversation.participants} 
          isGroup={conversation.isGroup}
          name={conversation.name}
        />
      </div>
    </div>
  );
}