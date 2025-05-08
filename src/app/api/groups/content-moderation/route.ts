// src/app/api/groups/content-moderation/route.ts
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
    const { content, groupId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "კონტენტი აუცილებელია" },
        { status: 400 }
      );
    }

    // თუ მოცემულია ჯგუფის ID, შევამოწმოთ არის თუ არა მომხმარებელი მოდერატორი ან ადმინისტრატორი
    if (groupId) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: {
            in: ['admin', 'moderator']
          }
        }
      });

      if (!membership) {
        return NextResponse.json(
          { error: "თქვენ არ გაქვთ მოდერაციის უფლება ამ ჯგუფში" },
          { status: 403 }
        );
      }
    }

    // კონტენტის მოდერაცია Gemini AI-ით
    const moderationResult = await gemini.moderateContent(content);

    // შევინახოთ მოდერაციის შედეგი (ოფციონალურად)
    if (groupId) {
      await prisma.moderationLog.create({
        data: {
          content,
          result: JSON.stringify(moderationResult),
          isSafe: moderationResult.isSafe,
          confidence: moderationResult.confidence,
          groupId,
          moderatedById: userId
        }
      });
    }
    
    return NextResponse.json({
      moderation: moderationResult
    });
  } catch (error) {
    console.error("კონტენტის მოდერაციის შეცდომა:", error);
    return NextResponse.json(
      { error: "კონტენტის მოდერაცია ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}