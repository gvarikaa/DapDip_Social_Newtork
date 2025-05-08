import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";
import { OpenAI } from "@/utils/openai";

// პოსტის ან კომენტარის AI ანალიზი
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; postId: string } }
) {
  try {
    const { groupId, postId } = params;
    
    if (!groupId || !postId) {
      return NextResponse.json(
        { error: "ჯგუფის და პოსტის იდენტიფიკატორები აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ავტორიზაცია საჭიროა" },
        { status: 401 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { 
      commentId, // თუ ანალიზს ვუკეთებთ კომენტარს, არა პოსტს
      requestTruthCheck = false // მოითხოვს თუ არა ფაქტების შემოწმებას
    } = requestData;

    // ჯგუფის მოძიება და შემოწმება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        categories: true,
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

    // შევამოწმოთ არის თუ არა ქვანტური აზროვნების ჯგუფი
    if (group.type !== 'quantum') {
      return NextResponse.json(
        { error: "ანალიზი შესაძლებელია მხოლოდ 'ქვანტური აზროვნების' ტიპის ჯგუფებში" },
        { status: 400 }
      );
    }

    // შევამოწმოთ ჯგუფს აქვს თუ არა კატეგორიები
    if (!group.categories.length) {
      return NextResponse.json(
        { error: "ჯგუფს არ გააჩნია აზრობრივი კატეგორიები ანალიზისთვის" },
        { status: 400 }
      );
    }

    // შევამოწმოთ არის თუ არა მომხმარებელი ჯგუფის წევრი
    if (group.isPrivate && !group.members.length) {
      return NextResponse.json(
        { error: "თქვენ არ ხართ ამ ჯგუფის წევრი" },
        { status: 403 }
      );
    }

    let content = "";
    let targetId = "";
    let targetType = "";
    let existingAnalysis = null;

    // შევამოწმოთ რა ანალიზდება - პოსტი თუ კომენტარი
    if (commentId) {
      // კომენტარის მოძიება
      const comment = await prisma.groupComment.findUnique({
        where: { 
          id: commentId,
          postId  // ვამოწმებთ რომ კომენტარი ამ პოსტზეა
        },
        include: {
          analysis: true
        }
      });

      if (!comment) {
        return NextResponse.json(
          { error: "კომენტარი ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      content = comment.content;
      targetId = commentId;
      targetType = "comment";
      existingAnalysis = comment.analysis;
    } else {
      // პოსტის მოძიება
      const post = await prisma.groupPost.findUnique({
        where: { 
          id: postId,
          groupId,
          isPending: false // მხოლოდ დადასტურებული პოსტები შეიძლება გაანალიზდეს
        },
        include: {
          analysis: true
        }
      });

      if (!post) {
        return NextResponse.json(
          { error: "პოსტი ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      content = post.content;
      targetId = postId;
      targetType = "post";
      existingAnalysis = post.analysis;
    }

    // თუ უკვე გაანალიზებულია და არ მოითხოვს ფაქტების შემოწმებას, ვაბრუნებთ არსებულ ანალიზს
    if (existingAnalysis && !requestTruthCheck) {
      return NextResponse.json({
        success: true,
        message: "ანალიზი უკვე არსებობს",
        analysis: existingAnalysis,
        isExisting: true
      });
    }

    // კატეგორიების მომზადება AI-სთვის
    const categories = group.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      criteria: cat.criteria || "",
    }));

    // OpenAI API გამოძახება - აქ გამარტივებულია, რეალურ სისტემაში უფრო რთული პრომპტი იქნება
    const openai = new OpenAI();
    
    // ანალიზის პრომპტი - გადაეცემა კატეგორიები და კონტენტი
    const prompt = `
      ანალიზი გაუკეთე შემდეგ კონტენტს და მიუსადაგე აზრობრივი კატეგორიები:
      
      კონტენტი: "${content}"
      
      კატეგორიები:
      ${categories.map(cat => `- ${cat.name}: ${cat.description || cat.name}`).join('\n')}
      
      კატეგორიების მიხედვით პროცენტული განაწილება უნდა იყოს 100%-ის ჯამში.
      დამატებით, შეაფასე სიმართლის მაჩვენებელი 0-დან 100-მდე.
      
      დააბრუნე JSON ფორმატში:
      {
        "categoryResults": {
          "${categories[0].id}": 25, // პროცენტული მაჩვენებელი
          "${categories[1].id}": 75  // და ა.შ. (ჯამში 100%)
        },
        "truthScore": 85, // 0-100 სიმართლის მაჩვენებელი
        "keyInsights": "მოკლე შეჯამება მთავარი აზრის"
      }
    `;

    // AI-ს მოთხოვნის გაგზავნა
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "თქვენ ხართ ქვანტური აზროვნების სისტემის AI ანალიტიკოსი. თქვენი მოვალეობაა შინაარსის ანალიზი და აზრობრივი კატეგორიებში განაწილება." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // AI-ს პასუხის პარსინგი
    const responseText = aiResponse.choices[0].message.content;
    let responseJson: any = {};
    
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI response as JSON", e);
      return NextResponse.json(
        { error: "AI ანალიზის პასუხის დამუშავების შეცდომა" },
        { status: 500 }
      );
    }

    // შედეგების მომზადება
    const { categoryResults, truthScore, keyInsights } = responseJson;

    // დომინანტური კატეგორიის განსაზღვრა
    let dominantCategoryId = null;
    let highestPercentage = 0;

    Object.keys(categoryResults).forEach(catId => {
      if (categoryResults[catId] > highestPercentage) {
        highestPercentage = categoryResults[catId];
        dominantCategoryId = catId;
      }
    });

    // ანალიზის შენახვა ან განახლება
    let analysis;
    if (existingAnalysis) {
      // არსებულის განახლება
      analysis = await prisma.opinionAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          result: categoryResults,
          truthScore,
          keyInsights,
          categoryId: dominantCategoryId
        }
      });
    } else {
      // ახლის შექმნა
      analysis = await prisma.opinionAnalysis.create({
        data: {
          result: categoryResults,
          truthScore,
          keyInsights,
          categoryId: dominantCategoryId,
          [targetType === "post" ? "postId" : "commentId"]: targetId
        }
      });
    }

    // თუ მოითხოვს ფაქტების შემოწმებას
    if (requestTruthCheck) {
      // ფაქტების შემოწმების დამატება (მოკლედ გამოსახული)
      await prisma.factCheck.create({
        data: {
          requesterId: userId,
          statement: content,
          analysisId: analysis.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "ანალიზი წარმატებით შესრულდა",
      analysis,
      isNew: !existingAnalysis
    });
  } catch (error: any) {
    console.error("Error analyzing content:", error);
    return NextResponse.json(
      { error: "კონტენტის ანალიზის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}