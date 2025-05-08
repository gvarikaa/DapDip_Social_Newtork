import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/server";
import { prisma } from "@/prisma";
import { generateGroupSearchVectors, searchGroupsWithAI } from "@/utils/gemini";

export const dynamic = "force-dynamic";

/**
 * API route for AI-enhanced group search functionality
 * This provides intelligent search capabilities beyond simple keyword matching
 * Features include:
 * - Semantic search (understands meaning, not just keywords)
 * - Synonym awareness (matches similar concepts)
 * - Natural language understanding
 * - Personalized results based on user interests
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
    const { query, filters, limit = 10, offset = 0 } = await request.json();
    
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "ძიების ტექსტი სავალდებულოა" },
        { status: 400 }
      );
    }

    // Get user information for personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: true,
        interests: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "მომხმარებელი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Generate search vectors for AI-enhanced search
    const searchVectors = await generateGroupSearchVectors(query);
    
    // Use AI to find semantically relevant groups
    const results = await searchGroupsWithAI(
      query,
      searchVectors,
      filters,
      user,
      { limit, offset }
    );

    // Return the search results
    return NextResponse.json({
      results,
      metadata: {
        total: results.length,
        limit,
        offset,
        query,
      },
    });
  } catch (error) {
    console.error("Error in AI group search:", error);
    return NextResponse.json(
      { error: "ძიების შესრულებისას დაფიქსირდა შეცდომა" },
      { status: 500 }
    );
  }
}

/**
 * Get route to retrieve available search filters
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

    // Get all group categories for filtering
    const categories = await prisma.groupCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Get trending topics that can be used as filters
    const trendingTopics = await prisma.groupTopic.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        groupsCount: "desc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        groupsCount: true,
      },
    });

    // Return filters for the search UI
    return NextResponse.json({
      filters: {
        categories,
        trendingTopics,
        activityLevels: [
          { id: "high", name: "მაღალი აქტიურობა" },
          { id: "medium", name: "საშუალო აქტიურობა" },
          { id: "low", name: "დაბალი აქტიურობა" },
        ],
        size: [
          { id: "large", name: "დიდი (100+ წევრი)" },
          { id: "medium", name: "საშუალო (20-100 წევრი)" },
          { id: "small", name: "მცირე (<20 წევრი)" },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching search filters:", error);
    return NextResponse.json(
      { error: "ფილტრების მიღებისას დაფიქსირდა შეცდომა" },
      { status: 500 }
    );
  }
}