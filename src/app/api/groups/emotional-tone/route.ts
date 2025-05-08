import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/server";
import { prisma } from "@/prisma";
import { analyzeEmotionalTone } from "@/utils/gemini";

/**
 * API მარშრუტი ემოციური ტონის ანალიზისთვის
 * ეს ფუნქცია აანალიზებს ჯგუფის პოსტების, კომენტარების ან 
 * დისკუსიების ემოციურ ტონს AI-ის დახმარებით.
 */
export async function POST(request: NextRequest) {
  try {
    // მომხმარებლის ავთენტიფიკაცია
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "მომხმარებელი არ არის ავტორიზებული" },
        { status: 401 }
      );
    }

    // მოთხოვნის პარამეტრების პარსინგი
    const { content, contentId, contentType = "post", detailLevel = "basic" } = await request.json();

    // შეამოწმეთ, რომ კონტენტი მითითებულია
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "კონტენტი არ არის მითითებული ან ცარიელია" },
        { status: 400 }
      );
    }

    // ვალიდაცია contentType-ის
    if (!["post", "comment", "discussion"].includes(contentType)) {
      return NextResponse.json(
        { error: "კონტენტის ტიპი არ არის ვალიდური" },
        { status: 400 }
      );
    }

    // ვალიდაცია detailLevel-ის
    if (!["basic", "detailed"].includes(detailLevel)) {
      return NextResponse.json(
        { error: "დეტალიზაციის დონე არ არის ვალიდური" },
        { status: 400 }
      );
    }

    // წვდომის უფლებები - თუ contentId მითითებულია, შემოწმდეს წვდომა
    if (contentId) {
      let hasAccess = false;

      switch (contentType) {
        case "post":
          // შემოწმება აქვს თუ არა მომხმარებელს წვდომა პოსტზე
          const post = await prisma.groupPost.findUnique({
            where: { id: contentId },
            include: {
              group: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          });

          if (post && post.group.members.length > 0) {
            hasAccess = true;
          }
          break;

        case "comment":
          // შემოწმება აქვს თუ არა მომხმარებელს წვდომა კომენტარზე
          const comment = await prisma.comment.findUnique({
            where: { id: contentId },
            include: {
              post: {
                include: {
                  group: {
                    include: {
                      members: {
                        where: { userId }
                      }
                    }
                  }
                }
              }
            }
          });

          if (comment && comment.post.group.members.length > 0) {
            hasAccess = true;
          }
          break;

        case "discussion":
          // შემოწმება აქვს თუ არა მომხმარებელს წვდომა დისკუსიაზე (ჯგუფზე)
          const group = await prisma.group.findUnique({
            where: { id: contentId },
            include: {
              members: {
                where: { userId }
              }
            }
          });

          if (group && group.members.length > 0) {
            hasAccess = true;
          }
          break;
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: "არ გაქვთ წვდომა ამ კონტენტზე" },
          { status: 403 }
        );
      }
    }

    // ემოციური ტონის ანალიზის გამოძახება
    const emotionalAnalysis = await analyzeEmotionalTone(
      content,
      contentType as 'post' | 'comment' | 'discussion',
      detailLevel as 'basic' | 'detailed'
    );

    // თუ contentId მითითებულია, შევინახოთ ანალიზის შედეგები
    if (contentId) {
      try {
        // ემოციური ანალიზის შენახვა მონაცემთა ბაზაში
        const savedAnalysis = await prisma.emotionalToneAnalysis.create({
          data: {
            contentId,
            contentType,
            analysis: emotionalAnalysis,
            primaryEmotion: emotionalAnalysis.primaryEmotion,
            intensity: emotionalAnalysis.intensity,
            sentiment: emotionalAnalysis.sentiment,
            requestedById: userId,
          },
        });
        
        // დავაბრუნოთ ID მომავალი მოთხოვნებისთვის
        return NextResponse.json({
          ...emotionalAnalysis,
          analysisId: savedAnalysis.id,
        });
      } catch (dbError) {
        console.error("ემოციური ანალიზის შენახვის შეცდომა:", dbError);
        // დავაბრუნოთ ანალიზი, მაგრამ აღვნიშნოთ, რომ შენახვა ვერ მოხერხდა
        return NextResponse.json({
          ...emotionalAnalysis,
          dbSaveError: "ანალიზის შენახვა ვერ მოხერხდა",
        });
      }
    }

    // დავაბრუნოთ ანალიზის შედეგები
    return NextResponse.json(emotionalAnalysis);
  } catch (error) {
    console.error("ემოციური ტონის ანალიზის შეცდომა:", error);
    return NextResponse.json(
      { error: "მოხდა შეცდომა ემოციური ტონის ანალიზისას" },
      { status: 500 }
    );
  }
}

/**
 * მარშრუტი გარკვეული კონტენტის არსებული ემოციური ანალიზის მისაღებად
 */
export async function GET(request: NextRequest) {
  try {
    // მომხმარებლის ავთენტიფიკაცია
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "მომხმარებელი არ არის ავტორიზებული" },
        { status: 401 }
      );
    }

    // მოთხოვნის პარამეტრების პარსინგი URL-დან
    const searchParams = request.nextUrl.searchParams;
    const contentId = searchParams.get("contentId");
    const contentType = searchParams.get("contentType") || "post";

    if (!contentId) {
      return NextResponse.json(
        { error: "contentId პარამეტრი აუცილებელია" },
        { status: 400 }
      );
    }

    // წვდომის უფლებები - შემოწმდეს მომხმარებელს აქვს თუ არა წვდომა კონტენტზე
    let hasAccess = false;
    let groupId: string | null = null;

    switch (contentType) {
      case "post":
        // შემოწმება აქვს თუ არა მომხმარებელს წვდომა პოსტზე
        const post = await prisma.groupPost.findUnique({
          where: { id: contentId },
          include: {
            group: {
              include: {
                members: {
                  where: { userId }
                }
              }
            }
          }
        });

        if (post && post.group.members.length > 0) {
          hasAccess = true;
          groupId = post.groupId;
        }
        break;

      case "comment":
        // შემოწმება აქვს თუ არა მომხმარებელს წვდომა კომენტარზე
        const comment = await prisma.comment.findUnique({
          where: { id: contentId },
          include: {
            post: {
              include: {
                group: {
                  include: {
                    members: {
                      where: { userId }
                    }
                  }
                }
              }
            }
          }
        });

        if (comment && comment.post.group.members.length > 0) {
          hasAccess = true;
          groupId = comment.post.groupId;
        }
        break;

      case "discussion":
        // შემოწმება აქვს თუ არა მომხმარებელს წვდომა დისკუსიაზე (ჯგუფზე)
        const group = await prisma.group.findUnique({
          where: { id: contentId },
          include: {
            members: {
              where: { userId }
            }
          }
        });

        if (group && group.members.length > 0) {
          hasAccess = true;
          groupId = group.id;
        }
        break;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "არ გაქვთ წვდომა ამ კონტენტზე" },
        { status: 403 }
      );
    }

    // ანალიზის მონაცემების მიღება მონაცემთა ბაზიდან
    const analysis = await prisma.emotionalToneAnalysis.findFirst({
      where: {
        contentId,
        contentType,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "ემოციური ანალიზი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // დავაბრუნოთ ანალიზის შედეგები
    return NextResponse.json({
      ...analysis.analysis,
      analysisId: analysis.id,
      analysisDate: analysis.createdAt,
      requestedBy: analysis.requestedBy,
      groupId,
    });
  } catch (error) {
    console.error("ემოციური ანალიზის მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "მოხდა შეცდომა ემოციური ანალიზის მიღებისას" },
      { status: 500 }
    );
  }
}