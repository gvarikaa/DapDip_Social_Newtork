// src/app/api/reels/[id]/like/route.ts - ლაიქი
import { NextRequest } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";
import { socketMethods } from "@/socket";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const reelId = params.id;

  try {
    // შევამოწმოთ არსებული ლაიქი
    const existingLike = await prisma.reelLike.findFirst({
      where: {
        reelId,
        userId
      }
    });

    if (existingLike) {
      // თუ უკვე მოწონებულია, წავშალოთ ლაიქი
      await prisma.reelLike.delete({
        where: { id: existingLike.id }
      });
      return Response.json({ liked: false });
    } else {
      // თუ არ არის მოწონებული, დავამატოთ ლაიქი
      await prisma.reelLike.create({
        data: {
          reelId,
          userId
        }
      });
      
      // ვიპოვოთ რილსის ავტორი ნოტიფიკაციისთვის
      const reel = await prisma.reel.findUnique({
        where: { id: reelId },
        select: { userId: true }
      });
      
      if (reel && reel.userId !== userId) {
        // ვნახოთ რილსის ავტორის მომხმარებლის სახელი
        const reelAuthor = await prisma.user.findUnique({
          where: { id: reel.userId },
          select: { username: true }
        });
        
        // ნოტიფიკაციის გაგზავნა
        socketMethods.sendNotification(reelAuthor?.username || "", {
          senderUsername: (await prisma.user.findUnique({
             where: { id: userId },
            select: { username: true }
          }))?.username || "",
          type: "like",
          link: `/reels/${reelId}`
        });
      }
      
      return Response.json({ liked: true });
    }
  } catch (error) {
    console.error("რილსის ლაიქისას შეცდომა:", error);
    return Response.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}