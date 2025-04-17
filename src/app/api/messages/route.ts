import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    const { content, conversationId, receiverId } = await request.json();

    if (!content || (!conversationId && !receiverId)) {
      return NextResponse.json(
        { error: "შეიყვანე მესიჯის შინაარსი და მიმღები ან სასაუბრო ID" },
        { status: 400 }
      );
    }

    let actualConversationId = conversationId;

    // თუ conversationId არ არის, ვეძებთ ან ვქმნით ახალს
    if (!actualConversationId && receiverId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          participants: {
            some: { userId }, // ერთ-ერთი მონაწილე უნდა იყოს userId
          },
          AND: {
            participants: {
              some: { userId: receiverId }, // მეორე მონაწილე უნდა იყოს receiverId
            },
          },
        },
        include: { participants: true },
      });

      if (existingConversation) {
        actualConversationId = existingConversation.id;
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId },
                { userId: receiverId },
              ],
            },
          },
        });
        actualConversationId = newConversation.id;
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        conversationId: actualConversationId,
      },
    });

    // OPTIONAL: conversation update for latest message time
    await prisma.conversation.update({
      where: { id: actualConversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("მესიჯის გაგზავნის შეცდომა:", error);
    return NextResponse.json(
      { error: "მესიჯის გაგზავნა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { error: "სასაუბრო ID აუცილებელია" },
      { status: 400 }
    );
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("მესიჯების მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "მესიჯების მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}
