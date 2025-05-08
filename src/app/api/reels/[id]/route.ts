// src/app/api/reels/[id]/route.ts - ერთი რილსის დეტალები
import { NextRequest } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const id = params.id;

  try {
    // ვიპოვოთ რილსი
    const reel = await prisma.reel.findUnique({
      where: { id },
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
        category: true,
        topics: true, // შესწორებულია თქვენი სქემის მიხედვით
        hashtags: { include: { hashtag: true } },
        _count: {
          select: {
            likes: true,
            comments: true,
            saves: true,
            shares: true
          }
        },
        likes: userId ? { where: { userId }, select: { id: true } } : undefined,
        saves: userId ? { where: { userId }, select: { id: true } } : undefined,
        analytics: true
      }
    });

    if (!reel) {
      return Response.json({ error: "რილსი ვერ მოიძებნა" }, { status: 404 });
    }

    // განახლება ნახვების რაოდენობის
    await prisma.reelAnalytics.update({
      where: { reelId: id },
      data: {
        viewsCount: { increment: 1 }
      }
    });

    return Response.json({ reel });
  } catch (error) {
    console.error("რილსის დეტალების მიღებისას შეცდომა:", error);
    return Response.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}