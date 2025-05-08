// src/app/api/reels/recommendations/route.ts - პერსონალიზებული რეკომენდაციები
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  try {
    // მივიღოთ მომხმარებლის ინტერესები
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      take: 5,
      include: { topic: true } // სწორია, schema-ში ReelTopic არის topic ველად
    });

    // თუ მომხმარებელს არ აქვს ინტერესები, გამოვიყენოთ პოპულარული თემები
    const topicIds = userInterests.length > 0
      ? userInterests.map(interest => interest.topicId)
      : await prisma.reelTopic.findMany({
          take: 5,
          orderBy: { reels: { _count: 'desc' } },
          select: { id: true }
        }).then(topics => topics.map(t => t.id));

    // ვიპოვოთ რეკომენდირებული რილსები
    const recommendedReels = await prisma.reel.findMany({
      where: {
        topics: {
          some: {
            id: { in: topicIds } // გასწორებული სქემის მიხედვით - პირდაპირი many-to-many ურთიერთობისთვის
          }
        },
        userId: { not: userId }, // გამოვრიცხოთ საკუთარი რილსები
        isPublished: true
      },
      orderBy: [
        { views: 'desc' }, // პოპულარული პირველ რიგში
        { createdAt: 'desc' } // შემდეგ უახლესი
      ],
      take: 10,
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
        topics: true, // schema-ს მიხედვით - პირდაპირი ურთიერთობით ReelTopic-თან
        hashtags: { include: { hashtag: true } },
        _count: {
          select: {
            likes: true,
            comments: true,
            saves: true
          }
        },
        likes: { where: { userId }, select: { id: true } },
        saves: { where: { userId }, select: { id: true } }
      }
    });

    return NextResponse.json({ reels: recommendedReels });
  } catch (error) {
    console.error("რეკომენდაციების მიღების შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}