// src/app/api/conversations/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId, // მოძებნე საუბრები სადაც user მონაწილეობს
          },
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        participants: true, // საჭიროა, რომ მივიღოთ მონაწილეები
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // თითოეული საუბარში ვიღებთ სხვა მონაწილეების ID-ებს
    const conversationsWithParticipants = conversations.map((conversation) => {
      const otherParticipants = conversation.participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.userId); // ვიღებთ მხოლოდ ID-ებს

      return {
        ...conversation,
        otherParticipants,
      };
    });

    return NextResponse.json(conversationsWithParticipants);
  } catch (error) {
    console.error("სასაუბროების მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "სასაუბროების მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}