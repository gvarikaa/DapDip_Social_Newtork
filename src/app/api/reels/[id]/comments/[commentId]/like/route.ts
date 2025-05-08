// src/app/api/reels/[id]/comments/[commentId]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";
import { socketMethods } from "@/socket";

// კომენტარის მოწონება/მოწონების გაუქმება
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const { id: reelId, commentId } = params;

  try {
    // შევამოწმოთ კომენტარის არსებობა
    const comment = await prisma.reelComment.findUnique({
      where: { 
        id: commentId,
        reelId // უზრუნველვყოთ, რომ კომენტარი ეკუთვნის სწორ რილსს
      },
      select: { 
        id: true, 
        userId: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json({ error: "კომენტარი ვერ მოიძებნა" }, { status: 404 });
    }

    // შევამოწმოთ არსებული მოწონება
    const existingLike = await prisma.reelCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId
        }
      }
    });

    let liked: boolean;

    if (existingLike) {
      // წავშალოთ არსებული მოწონება
      await prisma.reelCommentLike.delete({
        where: { id: existingLike.id }
      });
      liked = false;
    } else {
      // დავამატოთ ახალი მოწონება
      await prisma.reelCommentLike.create({
        data: {
          commentId,
          userId
        }
      });
      liked = true;

      // გავაგზავნოთ ნოტიფიკაცია, თუ არ ვარ თავად კომენტარის ავტორი
      if (comment.userId !== userId && liked) {
        // მივიღოთ მომწონებლის მონაცემები
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, displayName: true, img: true }
        });

        if (liker) {
          // გავაგზავნოთ ნოტიფიკაცია
          socketMethods.sendNotification(comment.user.username, {
            senderUsername: liker.username,
            senderDisplayName: liker.displayName || undefined,
            senderImg: liker.img || undefined,
            type: "like",
            link: `/reels/${reelId}/comments`,
            metadata: {
              reelId,
              commentId,
              isCommentLike: true
            }
          });
        }
      }
    }

    // მივიღოთ განახლებული მოწონებების რაოდენობა
    const likesCount = await prisma.reelCommentLike.count({
      where: { commentId }
    });

    return NextResponse.json({ liked, likesCount });
  } catch (error) {
    console.error("კომენტარის მოწონების შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}