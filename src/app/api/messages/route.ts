import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { imagekit } from "@/utils";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    // მივიღოთ მონაცემები FormData ან JSON ფორმატში
    const contentType = request.headers.get("content-type") || "";
    let content = "";
    let conversationId = "";
    let receiverId = "";
    let attachmentUrl = null;
    let attachmentType = null;
    
    if (contentType.includes("multipart/form-data")) {
      // FormData მოთხოვნა ფაილებით
      const formData = await request.formData();
      content = formData.get("content") as string || "";
      conversationId = formData.get("conversationId") as string || "";
      receiverId = formData.get("receiverId") as string || "";
      
      // ფაილის დამუშავება, თუ არის
      const file = formData.get("file") as File;
      
      if (file && file.size > 0) {
        // აქ შეგიძლიათ გამოიყენოთ ImageKit ან სხვა სერვისი ფაილების შესანახად
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // ფაილის ტიპის განსაზღვრა
        if (file.type.includes("image")) {
          attachmentType = "image";
        } else if (file.type.includes("pdf")) {
          attachmentType = "pdf";
        } else if (file.type.includes("doc")) {
          attachmentType = "doc";
        } else {
          attachmentType = "file";
        }
        
        // ფაილის ატვირთვა ImageKit-ზე
        const uploadResult = await new Promise((resolve, reject) => {
          imagekit.upload(
            {
              file: buffer,
              fileName: file.name,
              folder: "/messages",
            },
            function (error, result) {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });
        
        // მივიღოთ ფაილის URL
        if (uploadResult && typeof uploadResult === 'object' && 'url' in uploadResult) {
          attachmentUrl = uploadResult.url as string;
        }
      }
    } else {
      // სტანდარტული JSON მოთხოვნა
      const body = await request.json();
      content = body.content || "";
      conversationId = body.conversationId || "";
      receiverId = body.receiverId || "";
    }

    if (!content && !attachmentUrl) {
      return NextResponse.json(
        { error: "შეიყვანეთ მესიჯის შინაარსი ან ატვირთეთ ფაილი" },
        { status: 400 }
      );
    }

    if (!conversationId && !receiverId) {
      return NextResponse.json(
        { error: "მიუთითეთ საუბრის ID ან მიმღების ID" },
        { status: 400 }
      );
    }

    let actualConversationId = conversationId;

    // თუ conversationId არ არის, ვეძებთ ან ვქმნით ახალს
    if (!actualConversationId && receiverId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
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
        attachmentUrl,
        attachmentType
      },
      include: {
        sender: {
          select: {
            username: true,
            displayName: true,
            img: true
          }
        }
      }
    });

    // საუბრის განახლება ბოლო მესიჯის დროით
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
    // შევამოწმოთ არის თუ არა მომხმარებელი ამ საუბრის მონაწილე
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId
      }
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: "არაავტორიზებული წვდომა" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            username: true,
            displayName: true,
            img: true
          }
        }
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // განვაახლოთ მიღებული მესიჯების სტატუსი
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
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