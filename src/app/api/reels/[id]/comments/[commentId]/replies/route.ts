// src/app/api/reels/[id]/comments/[commentId]/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";

// პასუხების მიღება კონკრეტული კომენტარისთვის
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const { id: reelId, commentId } = params;
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || '20');

  try {
    // შევამოწმოთ მშობელი კომენტარის არსებობა
    const parentComment = await prisma.reelComment.findUnique({
      where: { 
        id: commentId,
        reelId // უზრუნველვყოთ, რომ კომენტარი ეკუთვნის სწორ რილსს
      },
      select: { id: true }
    });

    if (!parentComment) {
      return NextResponse.json({ error: "კომენტარი ვერ მოიძებნა" }, { status: 404 });
    }

    // მოვძებნოთ პასუხები
    const replies = await prisma.reelComment.findMany({
      where: {
        parentId: commentId,
        reelId
      },
      orderBy: {
        createdAt: 'asc' // პასუხები ქრონოლოგიური თანმიმდევრობით
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        },
        likes: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    // დავაბრუნოთ პასუხი
    return NextResponse.json({
      replies,
      total: replies.length,
      hasMore: replies.length >= limit
    });
  } catch (error) {
    console.error("პასუხების მოძიების შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}