import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

// Get all livestreams for a group
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

    // Find group
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

    // For private groups, check membership
    if (group.isPrivate) {
      if (!userId) {
        return NextResponse.json(
          { error: "პრივატული ჯგუფის ლაივსტრიმების სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      if (group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის ლაივსტრიმების ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // Check if user is a moderator/admin
    const isModerator = group.members.some(member => 
      member.role === "admin" || member.role === "moderator"
    );

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50); // Max 50
    const status = searchParams.get("status"); // optional filter by status
    const sort = searchParams.get("sort") || "scheduled"; // upcoming, live, recent

    // Create filter conditions
    const whereCondition: any = { groupId };
    
    // Status filter if provided
    if (status) {
      whereCondition.status = status;
    }
    
    // Only include public livestreams for non-members
    if (group.members.length === 0 && !group.isPrivate) {
      whereCondition.visibility = "public";
    }

    // Create sorting criteria
    let orderBy: any = {};
    switch (sort) {
      case "live":
        orderBy = [
          { status: "desc" }, // live first
          { actualStartTime: "desc" }
        ];
        break;
      case "recent":
        orderBy = { 
          actualStartTime: "desc" 
        };
        break;
      case "upcoming":
      default:
        orderBy = [
          { status: { equals: "scheduled" } },
          { scheduledStartTime: "asc" }
        ];
        break;
    }

    // Get total livestream count for pagination
    const totalLivestreams = await prisma.groupLivestream.count({
      where: whereCondition
    });

    // Get livestreams
    const livestreams = await prisma.groupLivestream.findMany({
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
            participants: true,
            views: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Filter sensitive information for non-creators/non-moderators
    const processedLivestreams = livestreams.map(livestream => {
      const isCreator = userId === livestream.createdById;
      
      // Remove sensitive data for non-creators/non-moderators
      if (!isCreator && !isModerator) {
        delete livestream.streamKey;
        
        // For private livestreams, hide additional data
        if (livestream.visibility === "private" && !group.members.some(m => m.userId === userId)) {
          delete livestream.settings;
        }
      }
      
      return livestream;
    });

    return NextResponse.json({
      livestreams: processedLivestreams,
      pagination: {
        total: totalLivestreams,
        page,
        pageSize,
        totalPages: Math.ceil(totalLivestreams / pageSize)
      },
      isModerator
    });
  } catch (error: any) {
    console.error("Error fetching group livestreams:", error);
    return NextResponse.json(
      { error: "ჯგუფის ლაივსტრიმების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Start a new livestream in a group
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

    // Find group and check membership
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
        { error: "ჯგუფში ლაივსტრიმის დასაწყებად საჭიროა წევრობა" },
        { status: 403 }
      );
    }

    // Request data
    const requestData = await request.json();
    const { 
      title,
      description,
      thumbnailUrl,
      scheduledStartTime,
      visibility = "public",
      maxParticipants,
      settings = {}
    } = requestData;

    // Validate input
    if (!title) {
      return NextResponse.json(
        { error: "ლაივსტრიმის სათაური აუცილებელია" },
        { status: 400 }
      );
    }

    // Generate a unique stream key
    const streamKey = crypto.randomBytes(16).toString("hex");
    
    // Create livestream
    const livestream = await prisma.groupLivestream.create({
      data: {
        title,
        description,
        thumbnailUrl,
        streamKey,
        status: "scheduled",
        visibility,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : new Date(Date.now() + 15 * 60000), // Default to 15 minutes from now
        maxParticipants,
        settings,
        createdById: userId,
        groupId
      }
    });

    // Create initial host participant record
    await prisma.livestreamParticipant.create({
      data: {
        role: "host",
        isActive: true,
        userId,
        livestreamId: livestream.id
      }
    });

    // Remove sensitive data from response
    const responseData = {
      ...livestream,
      streamKey: undefined // Don't send stream key in the response
    };

    return NextResponse.json({
      success: true,
      message: "ლაივსტრიმი წარმატებით შეიქმნა",
      livestream: responseData
    });
  } catch (error: any) {
    console.error("Error creating group livestream:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმის შექმნის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}