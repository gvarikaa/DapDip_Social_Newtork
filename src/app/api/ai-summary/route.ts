// src/app/api/ai-summary/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI ინიციალიზაცია
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// კომენტარების შესაჯამებელი ფუნქცია
async function summarizeDiscussion(comments: any[]): Promise<string> {
  try {
    // მოვამზადოთ კომენტარები გასაგები ფორმატით
    const formattedComments = comments.map(comment => 
      `კომენტარი (${comment.user.username}): ${comment.desc}`
    ).join("\n\n");

    // სისტემური ინსტრუქცია კომენტარების რაოდენობის მიხედვით
    const systemInstruction = comments.length === 1
      ? `შენ ხარ კომენტარების ანალიტიკოსი. გააანალიზე მოცემული კომენტარი 
         და გამოთქვი მოსაზრება მის შესახებ. ანალიზი დაწერე ქართულად, 
         მოკლედ და ინფორმაციულად.`
      : `შენ ხარ დისკუსიების ანალიტიკოსი. 
         გთხოვენ შეაჯამო მოცემული დისკუსია, გამოჰყო ძირითადი მოსაზრებები და არგუმენტები.
         შეჯამება დაწერე ქართულად, 3-5 პუნქტად. თითოეული პუნქტი უნდა იყოს მოკლე და ინფორმაციული.
         ბოლოს, გააკეთე მოკლე დასკვნა, რომელიც ასახავს დისკუსიის მთავარ აზრს.`;

    // შევქმნათ მოთხოვნა OpenAI API-სთვის
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: `${comments.length === 1 ? 'გააანალიზე ეს კომენტარი' : 'გთხოვ შეაჯამო შემდეგი დისკუსია'}:\n\n${formattedComments}`
        }
      ],
      max_tokens: 500
    });

    return completion.choices[0].message.content || "სამწუხაროდ, ვერ მოხერხდა დისკუსიის შეჯამება.";
  } catch (error) {
    console.error("OpenAI API შეცდომა:", error);
    return "ტექნიკური შეფერხების გამო ვერ მოხერხდა დისკუსიის შეჯამება. სცადეთ მოგვიანებით.";
  }
}

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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "პოსტის ID აუცილებელია" },
        { status: 400 }
      );
    }

    // შემოწმება, არსებობს თუ არა უკვე შეჯამება
    const existingSummary = await prisma.discussionSummary.findFirst({
      where: {
        postId: Number(postId),
        requestedById: userId
      }
    });

    if (existingSummary) {
      return NextResponse.json({ summary: existingSummary.content });
    }

    // პოსტის და მისი კომენტარების მოძიება
    const comments = await prisma.post.findMany({
      where: { 
        parentPostId: Number(postId),
      },
      include: {
        user: { 
          select: { 
            username: true, 
            displayName: true 
          } 
        },
        _count: { 
          select: { 
            likes: true, 
            comments: true 
          } 
        }
      }
    });

    if (!comments || comments.length === 0) {
      return NextResponse.json(
        { error: "პოსტს არ აქვს კომენტარები შესაჯამებლად" },
        { status: 400 }
      );
    }

    // კომენტარების დალაგება პოპულარობის მიხედვით
    const sortedComments = comments.some(c => (c._count.likes || 0) > 0 || (c._count.comments || 0) > 0)
      ? comments.sort((a, b) => {
          const aPopularity = (a._count.likes || 0) + (a._count.comments || 0);
          const bPopularity = (b._count.likes || 0) + (b._count.comments || 0);
          return bPopularity - aPopularity;
        })
      : comments.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

    // ავიღოთ 20 ყველაზე პოპულარული კომენტარი
    const topComments = sortedComments.slice(0, 20);

    // მივიღოთ შეჯამება OpenAI-სგან
    const summary = await summarizeDiscussion(topComments);

    // შევინახოთ შეჯამება ბაზაში
    const savedSummary = await prisma.discussionSummary.create({
      data: {
        content: summary,
        postId: Number(postId),
        requestedById: userId
      }
    });
    
    return NextResponse.json({ summary: savedSummary.content });
  } catch (error) {
    console.error("დისკუსიის შეჯამების შეცდომა:", error);
    return NextResponse.json(
      { error: "დისკუსიის შეჯამება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}