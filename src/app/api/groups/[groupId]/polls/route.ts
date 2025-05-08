import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get all polls for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    if (!groupId) {
      return NextResponse.json(
        { error: "ჯგუფის იდენტიფიკატორი აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Find the group
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

    // For private groups, check membership
    if (group.isPrivate) {
      if (!userId) {
        return NextResponse.json(
          { error: "პრივატული ჯგუფის გამოკითხვების სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      if (group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის გამოკითხვების ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50); // Max 50
    const includeExpired = searchParams.get("includeExpired") === "true";
    const sortBy = searchParams.get("sort") || "latest"; // 'latest', 'mostVotes', 'endingSoon'

    // Create filter conditions
    const whereCondition: any = {
      groupId
    };

    // Don't include expired polls unless explicitly requested
    if (!includeExpired) {
      whereCondition.OR = [
        { endDate: { gt: new Date() } },
        { endDate: null }
      ];
    }

    // Create sorting criteria
    let orderBy: any = {};
    switch (sortBy) {
      case "mostVotes":
        orderBy = {
          votes: {
            _count: "desc"
          }
        };
        break;
      case "endingSoon":
        orderBy = {
          endDate: "asc"
        };
        break;
      case "latest":
      default:
        orderBy = {
          createdAt: "desc"
        };
        break;
    }

    // Get total poll count for pagination
    const totalPolls = await prisma.groupPoll.count({
      where: whereCondition
    });

    // Get polls
    const polls = await prisma.groupPoll.findMany({
      where: whereCondition,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        },
        votes: userId ? {
          where: { userId },
          select: { id: true, optionId: true }
        } : undefined
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      polls,
      pagination: {
        total: totalPolls,
        page,
        pageSize,
        totalPages: Math.ceil(totalPolls / pageSize)
      }
    });
  } catch (error: any) {
    console.error("Error fetching group polls:", error);
    return NextResponse.json(
      { error: "ჯგუფის გამოკითხვების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Create a new poll in a group
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    if (!groupId) {
      return NextResponse.json(
        { error: "ჯგუფის იდენტიფიკატორი აუცილებელია" },
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

    // Check group existence and membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
          select: { id: true, role: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check if user is a member
    if (group.members.length === 0) {
      return NextResponse.json(
        { error: "ჯგუფში გამოკითხვის შესაქმნელად საჭიროა წევრობა" },
        { status: 403 }
      );
    }

    // Get request data
    const requestData = await request.json();
    const { 
      question,
      options,
      isMultiple = false,
      isAnonymous = false,
      endDate = null
    } = requestData;

    // Validate input
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "საჭიროა კითხვა და მინიმუმ 2 პასუხის ვარიანტი" },
        { status: 400 }
      );
    }

    // Format options
    const formattedOptions = options.map((option: string, index: number) => ({
      id: `option_${index + 1}`,
      text: option
    }));

    // Create poll
    const poll = await prisma.groupPoll.create({
      data: {
        question,
        options: formattedOptions,
        isMultiple,
        isAnonymous,
        endDate: endDate ? new Date(endDate) : null,
        createdById: userId,
        groupId
      }
    });

    return NextResponse.json({
      success: true,
      message: "გამოკითხვა წარმატებით შეიქმნა",
      poll
    });
  } catch (error: any) {
    console.error("Error creating group poll:", error);
    return NextResponse.json(
      { error: "გამოკითხვის შექმნის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}