import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChatBox from "@/components/Chat/ChatBox";
import FriendsList from "@/components/Chat/FriendsList";
import { prisma } from "@/prisma";
import ConversationParticipants from "@/components/Chat/ConversationParticipants";
import ChatHeader from "@/components/Chat/ChatHeader";
import UserProfileSidebar from "@/components/Chat/UserProfileSidebar";

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
  
  // მივიღოთ საუბრის სახელი და მეორე მონაწილის მონაცემები
  let chatName = conversation.name;
  let chatImage = null;
  let otherParticipant = null;
  let otherParticipantId = null;
  
  if (!conversation.isGroup) {
    // პირადი საუბრისთვის ვიპოვოთ მეორე მონაწილე
    otherParticipant = conversation.participants.find(
      p => p.userId !== userId
    );
    
    if (otherParticipant && otherParticipant.user) {
      chatName = otherParticipant.user.displayName || otherParticipant.user.username;
      chatImage = otherParticipant.user.img;
      otherParticipantId = otherParticipant.userId;
    }
  }
  
  return (
    <div className="h-screen flex">
      {/* მარცხენა სვეტი - მეგობრების სია */}
      <div className="w-1/5 hidden lg:block border-r border-borderGray">
        <FriendsList />
      </div>
      
      {/* შუა სვეტი - ჩატის ნაწილი */}
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader 
          conversationId={params.conversationId}
          chatName={chatName || "უცნობი საუბარი"}
          chatImage={chatImage}
          isGroup={conversation.isGroup}
          receiverId={otherParticipantId || ""}
        />
        
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
      
      {/* მარჯვენა სვეტი - მომხმარებლის ინფორმაცია და გაზიარებული მედია */}
      {!conversation.isGroup && otherParticipantId && (
        <div className="w-1/4 hidden lg:block">
          <UserProfileSidebar 
            userId={otherParticipantId} 
            conversationId={params.conversationId} 
          />
        </div>
      )}
    </div>
  );
}