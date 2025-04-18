// src/app/api/ai-comments/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI ინიციალიზაცია
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// რეალური OpenAI API გამოძახება
async function getAIResponse(commentContent: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `შენ ხარ სოციალური მედიის მომხმარებლის დამხმარე AI. გთხოვენ გააანალიზო კომენტარი და მასთან დაკავშირებით მოსაზრება გამოთქვა. 
          პასუხი წერე ქართულ ენაზე. იყავი ინფორმაციული, მაგრამ მოკლე და პირდაპირი.
          პასუხი არ უნდა იყოს 3 წინადადებაზე მეტი.`
        },
        {
          role: "user",
          content: `გააანალიზე ეს კომენტარი და გამოთქვი შენი მოსაზრება: "${commentContent}"`
        }
      ],
      max_tokens: 150
    });

    return completion.choices[0].message.content || "სამწუხაროდ, ვერ მოხერხდა კომენტარის ანალიზი.";
  } catch (error) {
    console.error("OpenAI API შეცდომა:", error);
    return "ტექნიკური შეფერხების გამო ვერ მოხერხდა კომენტარის ანალიზი. სცადეთ მოგვიანებით.";
  }
}

// საათშირა გამოძახებების ლიმიტის საკონტროლო ობიექტი
const apiLimiter = {
  calls: 0,
  lastReset: Date.now(),
  limit: 50, // საათში მაქსიმუმ 50 გამოძახება
  reset() {
    if (Date.now() - this.lastReset > 3600000) { // 1 საათი
      this.calls = 0;
      this.lastReset = Date.now();
      return true;
    }
    return false;
  },
  canMakeCall() {
    this.reset();
    return this.calls < this.limit;
  },
  recordCall() {
    this.calls += 1;
  }
};

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
    const { postId, commentContent } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "პოსტის ID აუცილებელია" },
        { status: 400 }
      );
    }

    // პოსტის არსებობის შემოწმება
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!post) {
      return NextResponse.json(
        { error: "პოსტი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // შემოწმება, უკვე არსებობს თუ არა AI კომენტარი ამ პოსტზე
    const existingAIComment = await prisma.aIComment.findFirst({
      where: {
        postId: Number(postId),
        requestedById: userId,
      },
    });

    if (existingAIComment) {
      return NextResponse.json(existingAIComment);
    }

    // შევამოწმოთ API გამოძახებების ლიმიტი
    if (!apiLimiter.canMakeCall()) {
      return NextResponse.json(
        { error: "მიღწეულია API გამოძახებების ლიმიტი. სცადეთ მოგვიანებით." },
        { status: 429 }
      );
    }

    // AI-ის პასუხის მიღება
    const aiResponseContent = await getAIResponse(commentContent);
    apiLimiter.recordCall();

    // ახალი AI კომენტარის შექმნა
    const aiComment = await prisma.aIComment.create({
      data: {
        content: aiResponseContent,
        postId: Number(postId),
        requestedById: userId,
      },
    });

    return NextResponse.json(aiComment);
  } catch (error) {
    console.error("AI კომენტარის შექმნის შეცდომა:", error);
    return NextResponse.json(
      { error: "AI კომენტარის შექმნა ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // ავთენტიფიკაციის შემოწმება
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json(
      { error: "პოსტის ID აუცილებელია" },
      { status: 400 }
    );
  }

  try {
    // მოცემული პოსტისთვის AI კომენტარების მოძიება
    const aiComments = await prisma.aIComment.findMany({
      where: {
        postId: Number(postId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(aiComments);
  } catch (error) {
    console.error("AI კომენტარების მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "AI კომენტარების მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}