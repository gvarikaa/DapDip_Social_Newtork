// src/app/api/groups/ai-moderator/route.ts
import { prisma } from "@/prisma";
import { auth } from "@/utils/supabase/auth";
import { NextRequest, NextResponse } from "next/server";
import gemini from "@/utils/gemini";

export async function POST(request: NextRequest) {
  // ავთენტიფიკაციის შემოწმება
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { groupId, groupContext, posts, previousResponses = [] } = body;

    if (!groupId || !groupContext || !posts) {
      return NextResponse.json(
        { error: "ჯგუფის ID, კონტექსტი და პოსტები აუცილებელია" },
        { status: 400 }
      );
    }

    // ჯგუფის არსებობის შემოწმება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი თუ ჯგუფი პრივატულია
    if (group.isPrivate && group.members.length === 0) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ წვდომა ამ ჯგუფზე" },
        { status: 403 }
      );
    }

    // ჯგუფის მოდერატორის პასუხის მიღება
    const aiResponse = await gemini.getAIModeratorResponse(
      groupContext,
      posts,
      previousResponses
    );

    // შევინახოთ მოდერატორის პასუხი
    await prisma.aIModeratorResponse.create({
      data: {
        content: aiResponse,
        groupId,
        requestedById: userId
      }
    });
    
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("AI მოდერატორის პასუხის გენერირების შეცდომა:", error);
    return NextResponse.json(
      { error: "AI მოდერატორის პასუხი ვერ მომზადდა" },
      { status: 500 }
    );
  }
}