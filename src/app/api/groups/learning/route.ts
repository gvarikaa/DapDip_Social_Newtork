import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/server";
import { prisma } from "@/prisma";
import { 
  generateLearningPlan, 
  generateQuiz, 
  analyzeLearningProgress,
  generateLearningMaterials 
} from "@/utils/gemini";

/**
 * API endpoint for personalized learning experiences
 * This provides different learning functionalities based on the action parameter
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "მომხმარებელი არ არის ავტორიზებული" },
        { status: 401 }
      );
    }

    // Parse the request
    const { 
      action, 
      groupId,
      topic, 
      userLevel,
      learningStyle,
      timeAvailable,
      goals,
      difficulty,
      questionsCount,
      questionTypes,
      quizResults,
      previousProgress,
      materialType,
      skillLevel,
      format
    } = await request.json();

    // Check if action is provided
    if (!action) {
      return NextResponse.json(
        { error: "action პარამეტრი აუცილებელია" },
        { status: 400 }
      );
    }

    // If groupId is provided, check access
    if (groupId) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId,
          groupId,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "თქვენ არ გაქვთ წვდომა ამ ჯგუფზე" },
          { status: 403 }
        );
      }
    }

    // Process based on action
    switch (action) {
      case "generate_plan": {
        // Validate required parameters
        if (!topic || !userLevel) {
          return NextResponse.json(
            { error: "მოთხოვნილი პარამეტრები არასრულია (topic, userLevel)" },
            { status: 400 }
          );
        }

        // Generate learning plan
        const learningPlan = await generateLearningPlan(
          topic,
          userLevel,
          learningStyle,
          timeAvailable,
          goals,
          goals?.split(",")
        );

        try {
          // Save the learning plan
          if (groupId) {
            await prisma.learningPlan.create({
              data: {
                topic,
                userLevel,
                learningStyle: learningStyle || "visual",
                timeAvailable: timeAvailable || 60,
                goals: goals || `${topic}-ის შესწავლა`,
                plan: learningPlan,
                userId,
                groupId,
              },
            });
          }
        } catch (err) {
          console.error("Error saving learning plan:", err);
          // Continue without saving
        }

        return NextResponse.json({
          action: "generate_plan",
          topic,
          learningPlan,
        });
      }

      case "generate_quiz": {
        // Validate required parameters
        if (!topic || !difficulty) {
          return NextResponse.json(
            { error: "მოთხოვნილი პარამეტრები არასრულია (topic, difficulty)" },
            { status: 400 }
          );
        }

        // Generate quiz
        const quiz = await generateQuiz(
          topic,
          difficulty,
          questionsCount,
          questionTypes
        );

        try {
          // Save the quiz
          if (groupId) {
            await prisma.learningQuiz.create({
              data: {
                topic,
                difficulty,
                questionsCount: questionsCount || 5,
                quiz,
                userId,
                groupId,
              },
            });
          }
        } catch (err) {
          console.error("Error saving quiz:", err);
          // Continue without saving
        }

        return NextResponse.json({
          action: "generate_quiz",
          topic,
          quiz,
        });
      }

      case "analyze_progress": {
        // Validate required parameters
        if (!topic || !quizResults) {
          return NextResponse.json(
            { error: "მოთხოვნილი პარამეტრები არასრულია (topic, quizResults)" },
            { status: 400 }
          );
        }

        // Analyze progress
        const progressAnalysis = await analyzeLearningProgress(
          topic,
          quizResults,
          previousProgress
        );

        try {
          // Save the progress analysis
          if (groupId) {
            await prisma.learningProgress.create({
              data: {
                topic,
                quizResults: quizResults,
                analysis: progressAnalysis,
                userId,
                groupId,
              },
            });
          }
        } catch (err) {
          console.error("Error saving progress analysis:", err);
          // Continue without saving
        }

        return NextResponse.json({
          action: "analyze_progress",
          topic,
          progressAnalysis,
        });
      }

      case "generate_materials": {
        // Validate required parameters
        if (!topic || !materialType || !skillLevel) {
          return NextResponse.json(
            { error: "მოთხოვნილი პარამეტრები არასრულია (topic, materialType, skillLevel)" },
            { status: 400 }
          );
        }

        // Generate learning materials
        const materials = await generateLearningMaterials(
          topic,
          materialType,
          skillLevel,
          format
        );

        try {
          // Save the learning materials
          if (groupId) {
            await prisma.learningMaterial.create({
              data: {
                topic,
                materialType,
                skillLevel,
                format: format || "markdown",
                content: typeof materials === 'string' ? materials : JSON.stringify(materials),
                userId,
                groupId,
              },
            });
          }
        } catch (err) {
          console.error("Error saving learning materials:", err);
          // Continue without saving
        }

        return NextResponse.json({
          action: "generate_materials",
          topic,
          materials,
        });
      }

      default:
        return NextResponse.json(
          { error: "მითითებული action არ არის მხარდაჭერილი" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Learning API error:", error);
    return NextResponse.json(
      { error: "სასწავლო API-ს გამოძახებისას მოხდა შეცდომა" },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for retrieving learning resources
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "მომხმარებელი არ არის ავტორიზებული" },
        { status: 401 }
      );
    }

    // Get request parameters
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const resourceType = searchParams.get("resourceType"); // plan, quiz, progress, material
    const topic = searchParams.get("topic");

    // Build query parameters
    const queryParams: any = { userId };
    
    if (groupId) {
      // Check group access
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId,
          groupId,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "თქვენ არ გაქვთ წვდომა ამ ჯგუფზე" },
          { status: 403 }
        );
      }
      
      queryParams.groupId = groupId;
    }
    
    if (topic) {
      queryParams.topic = topic;
    }

    // Get requested resources based on type
    switch (resourceType) {
      case "plan": {
        const learningPlans = await prisma.learningPlan.findMany({
          where: queryParams,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            group: groupId ? {
              select: {
                id: true,
                name: true,
              },
            } : undefined,
          },
        });

        return NextResponse.json({
          resourceType: "plan",
          count: learningPlans.length,
          data: learningPlans,
        });
      }

      case "quiz": {
        const quizzes = await prisma.learningQuiz.findMany({
          where: queryParams,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            group: groupId ? {
              select: {
                id: true,
                name: true,
              },
            } : undefined,
          },
        });

        return NextResponse.json({
          resourceType: "quiz",
          count: quizzes.length,
          data: quizzes,
        });
      }

      case "progress": {
        const progressData = await prisma.learningProgress.findMany({
          where: queryParams,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            group: groupId ? {
              select: {
                id: true,
                name: true,
              },
            } : undefined,
          },
        });

        return NextResponse.json({
          resourceType: "progress",
          count: progressData.length,
          data: progressData,
        });
      }

      case "material": {
        const materials = await prisma.learningMaterial.findMany({
          where: queryParams,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            group: groupId ? {
              select: {
                id: true,
                name: true,
              },
            } : undefined,
          },
        });

        return NextResponse.json({
          resourceType: "material",
          count: materials.length,
          data: materials,
        });
      }

      default: {
        // If no specific resource type is provided, return counts for all types
        const [plansCount, quizzesCount, progressCount, materialsCount] = await Promise.all([
          prisma.learningPlan.count({ where: queryParams }),
          prisma.learningQuiz.count({ where: queryParams }),
          prisma.learningProgress.count({ where: queryParams }),
          prisma.learningMaterial.count({ where: queryParams }),
        ]);

        return NextResponse.json({
          counts: {
            plans: plansCount,
            quizzes: quizzesCount,
            progress: progressCount,
            materials: materialsCount,
          },
        });
      }
    }
  } catch (error) {
    console.error("Learning resources retrieval error:", error);
    return NextResponse.json(
      { error: "სასწავლო რესურსების მიღებისას მოხდა შეცდომა" },
      { status: 500 }
    );
  }
}