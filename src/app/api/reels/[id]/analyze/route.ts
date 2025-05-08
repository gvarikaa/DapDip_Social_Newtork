// src/app/api/reels/[id]/analyze/route.ts - რილსის ანალიზი AI-თ
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const reelId = params.id;

  try {
    // ვიპოვოთ რილსი
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      include: {
        hashtags: {
          include: {
            hashtag: true
          }
        },
        user: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    if (!reel) {
      return NextResponse.json({ error: "რილსი ვერ მოიძებნა" }, { status: 404 });
    }

    // შევაგროვოთ რილსთან დაკავშირებული კომენტარები
    const comments = await prisma.reelComment.findMany({
      where: { reelId },
      select: {
        content: true,
        createdAt: true
      },
      take: 10, // ავიღოთ მხოლოდ 10 კომენტარი ანალიზისთვის
      orderBy: { createdAt: 'desc' }
    });

    // მოვამზადოთ მონაცემები GPT ანალიზისთვის
    const hashtags = reel.hashtags.map(h => h.hashtag.name).join(", ");
    const commentTexts = comments.map(c => c.content).join("\n");

    // გავაგზავნოთ მოთხოვნა GPT-ზე
    const prompt = `
      გააანალიზე შემდეგი რილსი:
      
      სათაური: ${reel.title || 'სათაური არ არის მითითებული'}
      აღწერა: ${reel.desc || 'აღწერა არ არის მითითებული'}
      ჰეშთეგები: ${hashtags || 'ჰეშთეგები არ არის მითითებული'}
      ავტორი: ${reel.user.displayName || reel.user.username}
      
      კომენტარები:
      ${commentTexts || 'კომენტარები არ არის'}
      
      გთხოვთ, მოგვაწოდოთ ამ რილსის ანალიზი, შემდეგი ინფორმაციის ჩათვლით:
      1. ძირითადი თემა
      2. სავარაუდო აუდიტორია
      3. კომენტარებიდან გამომდინარე განწყობა (პოზიტიური, ნეგატიური, ნეიტრალური)
      4. მსგავსი ინტერესების მქონე მომხმარებლებისთვის რეკომენდირებულია თუ არა
      5. მსგავსი ინტერესების თემები
      
      დააფორმატე პასუხი JSON-ად შემდეგი სტრუქტურით:
      {
        "mainTopic": "ძირითადი თემა",
        "targetAudience": ["სამიზნე აუდიტორია 1", "სამიზნე აუდიტორია 2"],
        "sentimentAnalysis": {
          "positive": 0.7, // წილი 0-დან 1-მდე
          "negative": 0.1,
          "neutral": 0.2
        },
        "isRecommended": true, // ან false
        "relatedTopics": ["მსგავსი თემა 1", "მსგავსი თემა 2"],
        "explanation": "მოკლე ანალიზი და ახსნა"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "შენ ხარ AI ასისტენტი, რომელიც სპეციალიზდება სოციალური მედიის კონტენტის ანალიზში. შენი დავალებაა გააანალიზო რილსის შინაარსი, კომენტარები და ჰეშთეგები, რათა მოგვაწოდო მისი ძირითადი თემა, სამიზნე აუდიტორია და რეკომენდაციები."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // შევინახოთ ანალიზის შედეგები ბაზაში
    await prisma.reelAnalytics.update({
      where: { reelId },
      data: {
        // შეგვიძლია დავამატოთ მეტა-მონაცემების შენახვა JSON ფორმატში
        demographicData: JSON.stringify(analysisResult.targetAudience || [])
      }
    });

    return NextResponse.json({ success: true, analysis: analysisResult });
  } catch (error) {
    console.error("რილსის ანალიზის შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}