// src/app/api/groups/ai-summary/route.ts
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

    // შემოწმება, არსებობს თუ არა უკვე შეჯამება
    const existingSummary = await prisma.groupDiscussionSummary.findFirst({
      where: {
        groupId,
        requestedById: userId,
        createdAt: {
          // შეჯამებები რომლებიც არ არის 24 საათზე ძველი
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingSummary) {
      return NextResponse.json({ summary: existingSummary.content });
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

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: "ჯგუფში არ არის პოსტები შესაჯამებლად" },
        { status: 400 }
      );
    }

    // პოსტების დალაგება პოპულარობის მიხედვით
    const sortedPosts = posts.some(c => (c._count.reactions || 0) > 0 || (c._count.comments || 0) > 0)
      ? posts.sort((a, b) => {
          const aPopularity = (a._count.reactions || 0) + (a._count.comments || 0);
          const bPopularity = (b._count.reactions || 0) + (b._count.comments || 0);
          return bPopularity - aPopularity;
        })
      : posts;

    // ავიღოთ 20 ყველაზე პოპულარული პოსტი
    const topPosts = sortedPosts.slice(0, 20);

    // მივიღოთ შეჯამება Gemini AI-სგან
    const summary = await gemini.summarizeGroupDiscussion(topPosts);

    // შევინახოთ შეჯამება ბაზაში
    const savedSummary = await prisma.groupDiscussionSummary.create({
      data: {
        content: summary,
        groupId,
        requestedById: userId
      }
    });
    
    return NextResponse.json({ summary: savedSummary.content });
  } catch (error) {
    console.error("ჯგუფის დისკუსიის შეჯამების შეცდომა:", error);
    return NextResponse.json(
      { error: "ჯგუფის დისკუსიის შეჯამება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}