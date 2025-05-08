// src/app/api/groups/visualization/route.ts
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
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: "ჯგუფის ID აუცილებელია" },
        { status: 400 }
      );
    }

    // შემოწმება, არსებობს თუ არა უკვე ვიზუალიზაცია
    const existingVisualization = await prisma.groupVisualization.findFirst({
      where: {
        groupId,
        createdAt: {
          // ვიზუალიზაცია რომელიც არ არის 24 საათზე ძველი
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingVisualization) {
      return NextResponse.json({ 
        visualization: JSON.parse(existingVisualization.data)
      });
    }

    // ჯგუფის და მისი პოსტების მოძიება
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

    // მოვიძიოთ ჯგუფის პოსტები
    const posts = await prisma.groupPost.findMany({
      where: { 
        groupId: groupId,
        isPending: false
      },
      include: {
        author: { 
          select: { 
            username: true, 
            displayName: true 
          } 
        },
        _count: { 
          select: { 
            comments: true,
            reactions: true
          } 
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30 // ბოლო 30 პოსტი
    });

    if (!posts || posts.length < 10) {
      return NextResponse.json(
        { error: "ჯგუფში არ არის საკმარისი პოსტები ვიზუალიზაციისთვის" },
        { status: 400 }
      );
    }

    // მივიღოთ ვიზუალიზაციის მონაცემები Gemini AI-სგან
    const visualizationData = await gemini.generateVisualizationData(posts);

    // შევინახოთ ვიზუალიზაცია ბაზაში
    const savedVisualization = await prisma.groupVisualization.create({
      data: {
        data: JSON.stringify(visualizationData),
        groupId,
        createdById: userId
      }
    });
    
    return NextResponse.json({ visualization: visualizationData });
  } catch (error) {
    console.error("დისკუსიის ვიზუალიზაციის მონაცემების გენერირების შეცდომა:", error);
    return NextResponse.json(
      { error: "ვიზუალიზაციის მონაცემების მომზადება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}