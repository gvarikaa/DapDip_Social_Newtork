import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/server";
import { prisma } from "@/prisma";
import { analyzePoll } from "@/utils/gemini";

/**
 * API endpoint for analyzing poll results using AI
 * This provides comprehensive analysis of poll data with different analysis types
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

    // Parse the request body
    const { pollId, analysisType = "basic" } = await request.json();

    if (!pollId) {
      return NextResponse.json(
        { error: "გამოკითხვის ID აუცილებელია" },
        { status: 400 }
      );
    }

    // Check if the analysis type is valid
    if (!["basic", "detailed", "trends", "demographics"].includes(analysisType)) {
      return NextResponse.json(
        { error: "ანალიზის ტიპი არ არის ვალიდური" },
        { status: 400 }
      );
    }

    // Fetch poll data
    const poll = await prisma.groupPoll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            members: {
              select: {
                id: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check user access to the poll
    const userMembership = await prisma.groupMember.findFirst({
      where: {
        userId,
        groupId: poll.groupId,
      },
    });

    if (!userMembership && poll.creator.id !== userId) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ წვდომა ამ გამოკითხვაზე" },
        { status: 403 }
      );
    }

    // Format poll data for analysis
    const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
    
    const formattedPoll = {
      question: poll.question,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        votes: option.votes.length,
      })),
      totalVotes,
      context: poll.description || "",
      groupInfo: {
        name: poll.group.name,
        description: poll.group.description || "",
        memberCount: poll.group.members.length,
      },
    };

    // Run the analysis
    const analysis = await analyzePoll(
      formattedPoll,
      analysisType as "basic" | "detailed" | "trends" | "demographics"
    );

    // Save the analysis result in the database
    try {
      const savedAnalysis = await prisma.pollAnalysis.create({
        data: {
          pollId,
          analysisType,
          analysis,
          createdById: userId,
        },
      });

      // Return the analysis with additional metadata
      return NextResponse.json({
        pollId,
        analysisType,
        analysis,
        analysisId: savedAnalysis.id,
        createdAt: savedAnalysis.createdAt,
        pollQuestion: poll.question,
        totalVotes,
      });
    } catch (err) {
      console.error("Error saving poll analysis:", err);
      
      // If we can't save, still return the analysis
      return NextResponse.json({
        pollId,
        analysisType,
        analysis,
        saveError: "ანალიზის შენახვა ვერ მოხერხდა, მაგრამ ანალიზი წარმატებით შესრულდა",
        pollQuestion: poll.question,
        totalVotes,
      });
    }
  } catch (error) {
    console.error("Poll analysis error:", error);
    return NextResponse.json(
      { error: "გამოკითხვის ანალიზის შესრულებისას მოხდა შეცდომა" },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for retrieving saved poll analyses
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

    // Get pollId from query params
    const searchParams = request.nextUrl.searchParams;
    const pollId = searchParams.get("pollId");
    
    if (!pollId) {
      return NextResponse.json(
        { error: "გამოკითხვის ID აუცილებელია" },
        { status: 400 }
      );
    }

    // Check if user has access to the poll
    const poll = await prisma.groupPoll.findUnique({
      where: { id: pollId },
      include: {
        group: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    if (poll.creator.id !== userId && poll.group.members.length === 0) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ წვდომა ამ გამოკითხვაზე" },
        { status: 403 }
      );
    }

    // Get the latest analysis for each type
    const analyses = await prisma.pollAnalysis.findMany({
      where: {
        pollId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // Group analyses by type to get only the latest of each type
    const latestByType: Record<string, any> = {};
    
    for (const analysis of analyses) {
      if (
        !latestByType[analysis.analysisType] || 
        new Date(analysis.createdAt) > new Date(latestByType[analysis.analysisType].createdAt)
      ) {
        latestByType[analysis.analysisType] = analysis;
      }
    }

    // Return the results
    return NextResponse.json({
      pollId,
      analyses: Object.values(latestByType),
      pollQuestion: poll.question,
    });
  } catch (error) {
    console.error("Error retrieving poll analyses:", error);
    return NextResponse.json(
      { error: "გამოკითხვის ანალიზების მიღებისას მოხდა შეცდომა" },
      { status: 500 }
    );
  }
}