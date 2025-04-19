// src/app/api/conversations/[conversationId]/media/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  const conversationId = params.conversationId;

  try {
    // ვამოწმებთ არის თუ არა მომხმარებელი ამ საუბრის მონაწილე
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId
      }
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: "ამ საუბრის წვდომა არ გაქვთ" },
        { status: 403 }
      );
    }

    // ვიღებთ ყველა მესიჯს, რომელსაც აქვს მიმაგრებული ფაილი ან სურათი
    const mediaMessages = await prisma.message.findMany({
      where: {
        conversationId,
        attachmentUrl: { not: null }
      },
      select: {
        id: true,
        attachmentUrl: true,
        attachmentType: true,
        createdAt: true,
        content: true,
        sender: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // ვაფორმატებთ მონაცემებს შესაბამის სტრუქტურაში
    const formattedMedia = mediaMessages.map(message => {
      const isImage = message.attachmentType?.includes("image");
      const isVideo = message.attachmentType?.includes("video");
      const isFile = !isImage && !isVideo && message.attachmentUrl;

      return {
        id: message.id.toString(),
        type: isImage ? "image" : isVideo ? "video" : "file",
        url: message.attachmentUrl || "",
        thumbnailUrl: isVideo ? message.attachmentUrl?.replace(/\.[^.]+$/, "_thumb.jpg") : message.attachmentUrl,
        filename: isFile ? extractFilename(message.content || message.attachmentUrl || "") : undefined,
        timestamp: message.createdAt.toISOString(),
        senderId: message.sender.id
      };
    });

    return NextResponse.json(formattedMedia);
  } catch (error) {
    console.error("მედიის მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "მედიის მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

// ფაილის სახელის ამოღება URL-იდან ან შეტყობინების შინაარსიდან
function extractFilename(text: string): string {
  // თუ შეტყობინებაში არის ფაილის სახელი
  const filenameMatch = text.match(/ფაილი: ([\w\s.-]+\.\w+)/i);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1];
  }

  // თუ არის URL, ბოლო ნაწილს ვიღებთ
  if (text.includes('/')) {
    const urlParts = text.split('/');
    return urlParts[urlParts.length - 1];
  }

  return "ფაილი";
}