// src/app/api/post-analysis/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI ინიციალიზაცია
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ანალიზის მონაცემების ტიპი
type PostAnalysis = {
  factCheck: {
    truthScore: number; // 0-100 პროცენტი
    isFake: boolean; // არის თუ არა ფეიკი
    explanation: string; // ახსნა
    realFacts?: string; // რეალური ფაქტები (თუ ფეიკია)
  };
  tonalAnalysis: {
    negative: number; // 0-100 პროცენტი
    positive: number; // 0-100 პროცენტი
    neutral: number; // 0-100 პროცენტი
    aggressive: number; // 0-100 პროცენტი
    humorous: number; // 0-100 პროცენტი
  };
};

// API-ის რაოდენობის შეზღუდვის მექანიზმი
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

// ფუნქცია იმის შესაფასებლად, შეიცავს თუ არა ტექსტი ფაქტობრივ მტკიცებულებებს
async function hasFactualContent(text: string): Promise<boolean> {
  // მარტივი შემოწმებები
  if (text.length < 20) return false;
  
  // თუ ტექსტი შეიცავს მხოლოდ მისალმებას
  const greetings = ["გამარჯობა", "სალამი", "მოგესალმებით", "hi", "hello"];
  if (greetings.some(g => text.toLowerCase().includes(g)) && text.length < 30) {
    return false;
  }
  
  // თუ ტექსტი შეიცავს მხოლოდ კითხვას
  if (text.trim().endsWith("?") && !text.includes(".")) return false;
  
  // უფრო რთული ანალიზისთვის ვიყენებთ OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "შეაფასე, შეიცავს თუ არა შემდეგი ტექსტი ფაქტობრივ მტკიცებულებებს, რომლებიც შეიძლება შემოწმდეს. მტკიცებულება არის ისეთი განცხადება, რომელიც ამტკიცებს რაიმე ფაქტს, რომელიც შეიძლება იყოს ჭეშმარიტი ან მცდარი. კითხვები, სუბიექტური აზრები, ემოციური გამოხატვა ან მისალმებები არ ითვლება ფაქტობრივ მტკიცებულებებად. პასუხი მოგვეცი მხოლოდ 'true' ან 'false'."
        },
        {
          role: "user", 
          content: text
        }
      ]
    });
    
    return completion.choices[0].message.content?.toLowerCase().includes('true') || false;
  } catch (e) {
    console.error("OpenAI API შეცდომა ფაქტობრივი კონტენტის შემოწმებისას:", e);
    return true; // შეცდომის შემთხვევაში დავაბრუნოთ true, რომ ვერ მოხერხდა შემოწმება
  }
}

// პოსტის ანალიზი OpenAI-ით
async function analyzePost(postContent: string): Promise<PostAnalysis> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `შენ ხარ ტექსტის ანალიზის ექსპერტი, რომელსაც ევალება შეაფასო პოსტის ფაქტობრივი სიზუსტე და ტონი.
          
          გააანალიზე მოცემული ტექსტი შემდეგი კრიტერიუმების მიხედვით:
          
          1. ფაქტობრივი სიზუსტე - რამდენად შეესაბამება რეალობას (0-100%), არის თუ არა ფეიკი, და რატომ ფიქრობ ასე.
          2. ტონალური ანალიზი - შეაფასე პროცენტებში რამდენად არის: ნეგატიური, პოზიტიური, ნეიტრალური, აგრესიული, იუმორისტული.
          
          პასუხი დააბრუნე მხოლოდ JSON ფორმატში (შენი მოსაზრებების გარეშე) შემდეგი სტრუქტურით:
          {
            "factCheck": {
              "truthScore": number, // 0-100 პროცენტი
              "isFake": boolean, // არის თუ არა ფეიკი (truthScore < 50)
              "explanation": string, // ახსნა თუ როგორ მიხვედი ამ დასკვნამდე
              "realFacts": string // რეალური ფაქტები (თუ ფეიკია)
            },
            "tonalAnalysis": {
              "negative": number, // 0-100 პროცენტი
              "positive": number, // 0-100 პროცენტი
              "neutral": number, // 0-100 პროცენტი
              "aggressive": number, // 0-100 პროცენტი
              "humorous": number // 0-100 პროცენტი
            }
          }`
        },
        {
          role: "user",
          content: `გააანალიზე ეს პოსტი/ტექსტი: "${postContent}"`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content || "{}";
    
    try {
      return JSON.parse(analysisText) as PostAnalysis;
    } catch (error) {
      console.error("JSON პარსინგის შეცდომა:", error);
      return {
        factCheck: {
          truthScore: 50,
          isFake: false,
          explanation: "ანალიზი ვერ მოხერხდა JSON პარსინგის შეცდომის გამო.",
        },
        tonalAnalysis: {
          negative: 0,
          positive: 0,
          neutral: 100,
          aggressive: 0,
          humorous: 0
        }
      };
    }
  } catch (error) {
    console.error("OpenAI API შეცდომა:", error);
    return {
      factCheck: {
        truthScore: 50,
        isFake: false,
        explanation: "ვერ მოხერხდა ანალიზი ტექნიკური შეფერხების გამო.",
      },
      tonalAnalysis: {
        negative: 0,
        positive: 0,
        neutral: 100,
        aggressive: 0,
        humorous: 0
      }
    };
  }
}

// პოსტის ტონის ანალიზი OpenAI-ით (მხოლოდ ტონის)
async function analyzeToneOnly(postContent: string): Promise<PostAnalysis> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `შენ ხარ ტექსტის ანალიზის ექსპერტი, რომელსაც ევალება შეაფასო პოსტის ტონი.
          
          გააანალიზე მოცემული ტექსტი და შეაფასე მისი ტონი პროცენტებში:
          - ნეგატიური (0-100%)
          - პოზიტიური (0-100%)
          - ნეიტრალური (0-100%)
          - აგრესიული (0-100%)
          - იუმორისტული (0-100%)
          
          პასუხი დააბრუნე მხოლოდ JSON ფორმატში (შენი მოსაზრებების გარეშე) შემდეგი სტრუქტურით:
          {
            "tonalAnalysis": {
              "negative": number,
              "positive": number,
              "neutral": number,
              "aggressive": number,
              "humorous": number
            }
          }`
        },
        {
          role: "user",
          content: `გააანალიზე ამ ტექსტის ტონი: "${postContent}"`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content || "{}";
    
    try {
      const toneAnalysis = JSON.parse(analysisText);
      
      return {
        factCheck: {
          truthScore: 50,
          isFake: false,
          explanation: "ეს პოსტი არ შეიცავს ფაქტობრივ განცხადებებს, რომლებიც შეიძლება შემოწმდეს.",
        },
        tonalAnalysis: toneAnalysis.tonalAnalysis || {
          negative: 0,
          positive: 0,
          neutral: 100,
          aggressive: 0,
          humorous: 0
        }
      };
    } catch (error) {
      console.error("JSON პარსინგის შეცდომა:", error);
      return {
        factCheck: {
          truthScore: 50,
          isFake: false,
          explanation: "ეს პოსტი არ შეიცავს ფაქტობრივ განცხადებებს, რომლებიც შეიძლება შემოწმდეს.",
        },
        tonalAnalysis: {
          negative: 0,
          positive: 0,
          neutral: 100,
          aggressive: 0,
          humorous: 0
        }
      };
    }
  } catch (error) {
    console.error("OpenAI API შეცდომა:", error);
    return {
      factCheck: {
        truthScore: 50,
        isFake: false,
        explanation: "ეს პოსტი არ შეიცავს ფაქტობრივ განცხადებებს, რომლებიც შეიძლება შემოწმდეს.",
      },
      tonalAnalysis: {
        negative: 0,
        positive: 0,
        neutral: 100,
        aggressive: 0,
        humorous: 0
      }
    };
  }
}

// POST მეთოდი - ახალი ანალიზის შექმნა
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
    const { postId, postContent } = body;

    if (!postId || !postContent) {
      return NextResponse.json(
        { error: "პოსტის ID და შინაარსი აუცილებელია" },
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

    // შემოწმება, უკვე არსებობს თუ არა ანალიზი ამ პოსტზე ბაზაში
    const existingAnalysis = await prisma.postAnalysis.findFirst({
      where: {
        postId: Number(postId),
        requestedById: userId,
      },
    });

    if (existingAnalysis) {
      try {
        // თუ უკვე არსებობს, დავაბრუნოთ არსებული ანალიზი
        const parsedAnalysis = JSON.parse(existingAnalysis.content);
        return NextResponse.json(parsedAnalysis);
      } catch (err) {
        // თუ JSON პარსინგი ჩავარდა, წავშალოთ არსებული და შევქმნათ ახალი
        await prisma.postAnalysis.delete({
          where: { id: existingAnalysis.id },
        });
      }
    }

    // შევამოწმოთ API გამოძახებების ლიმიტი
    if (!apiLimiter.canMakeCall()) {
      return NextResponse.json(
        { error: "მიღწეულია API გამოძახებების ლიმიტი. სცადეთ მოგვიანებით." },
        { status: 429 }
      );
    }

    // შევამოწმოთ, შეიცავს თუ არა პოსტი ფაქტობრივ კონტენტს
    const hasFactualContentResult = await hasFactualContent(postContent);
    apiLimiter.recordCall();

    let analysisResult: PostAnalysis;
    
    if (!hasFactualContentResult) {
      // თუ არ შეიცავს ფაქტობრივ კონტენტს, მხოლოდ ტონის ანალიზი გავაკეთოთ
      analysisResult = await analyzeToneOnly(postContent);
    } else {
      // თუ შეიცავს ფაქტობრივ კონტენტს, სრული ანალიზი გავაკეთოთ
      analysisResult = await analyzePost(postContent);
    }
    
    apiLimiter.recordCall();

    // შევინახოთ ანალიზი ბაზაში
    const postAnalysis = await prisma.postAnalysis.create({
      data: {
        content: JSON.stringify(analysisResult),
        postId: Number(postId),
        requestedById: userId,
      },
    });

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("პოსტის ანალიზის შეცდომა:", error);
    return NextResponse.json(
      { error: "პოსტის ანალიზი ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

// GET მეთოდი - არსებული ანალიზის მიღება
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
    // მოცემული პოსტისთვის ანალიზის მოძიება
    const analysis = await prisma.postAnalysis.findFirst({
      where: {
        postId: Number(postId),
        requestedById: userId
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!analysis) {
      return NextResponse.json({ found: false });
    }

    try {
      const parsedAnalysis = JSON.parse(analysis.content);
      return NextResponse.json({ found: true, analysis: parsedAnalysis });
    } catch (err) {
      return NextResponse.json(
        { error: "ანალიზის მონაცემების პარსინგი ვერ მოხერხდა" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("ანალიზის მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "ანალიზის მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}