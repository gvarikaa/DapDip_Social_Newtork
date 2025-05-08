import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get participants for a livestream
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string } }
) {
  try {
    const { groupId, livestreamId } = params;
    
    if (!groupId || !livestreamId) {
      return NextResponse.json(
        { error: "ჯგუფის და ლაივსტრიმის იდენტიფიკატორები აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Find livestream
    const livestream = await prisma.groupLivestream.findUnique({
      where: { 
        id: livestreamId,
        groupId 
      }
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ლაივსტრიმი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const role = searchParams.get("role"); // optional filter by role

    // Create filter
    const filter: any = { livestreamId };
    if (activeOnly) filter.isActive = true;
    if (role) filter.role = role;

    // Get participants
    const participants = await prisma.livestreamParticipant.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        }
      },
      orderBy: [
        { role: "asc" }, // hosts first
        { joinedAt: "asc" } // then by join time
      ]
    });

    // Get user's role if they are a participant
    const userParticipant = userId ? 
      await prisma.livestreamParticipant.findUnique({
        where: {
          userId_livestreamId: {
            userId,
            livestreamId
          }
        }
      }) : null;

    // Check if user is creator or moderator
    const isCreator = userId === livestream.createdById;
    const isModerator = isCreator || (userId ? 
      await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ["admin", "moderator"] }
        }
      }) : null);

    return NextResponse.json({
      participants,
      userRole: userParticipant?.role || "viewer",
      isActive: userParticipant?.isActive || false,
      canModerate: Boolean(isModerator),
      totalActive: await prisma.livestreamParticipant.count({
        where: {
          livestreamId,
          isActive: true
        }
      })
    });
  } catch (error: any) {
    console.error("Error fetching livestream participants:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმის მონაწილეების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Join livestream as participant
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string } }
) {
  try {
    const { groupId, livestreamId } = params;
    
    if (!groupId || !livestreamId) {
      return NextResponse.json(
        { error: "ჯგუფის და ლაივსტრიმის იდენტიფიკატორები აუცილებელია" },
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

    // Find livestream
    const livestream = await prisma.groupLivestream.findUnique({
      where: { 
        id: livestreamId,
        groupId
      },
      include: {
        _count: {
          select: { participants: { where: { isActive: true } } }
        }
      }
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ლაივსტრიმი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check if livestream is active
    if (livestream.status !== "live" && livestream.status !== "scheduled") {
      return NextResponse.json(
        { error: "ლაივსტრიმი არ არის აქტიური" },
        { status: 400 }
      );
    }

    // Check if max participants limit reached
    if (
      livestream.maxParticipants && 
      livestream._count.participants >= livestream.maxParticipants
    ) {
      return NextResponse.json(
        { error: "ლაივსტრიმში მონაწილეთა მაქსიმალური რაოდენობა მიღწეულია" },
        { status: 400 }
      );
    }

    // Check group membership for non-public livestreams
    if (livestream.visibility !== "public") {
      const isMember = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId
        }
      });
      
      if (!isMember) {
        return NextResponse.json(
          { error: "ამ ლაივსტრიმში მონაწილეობისთვის საჭიროა ჯგუფის წევრობა" },
          { status: 403 }
        );
      }
    }

    // Get request data
    const { role = "viewer" } = await request.json();
    
    // Only creator and moderators can be hosts
    let finalRole = role;
    if (role === "host" || role === "co-host") {
      const isCreator = userId === livestream.createdById;
      const isModerator = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          role: { in: ["admin", "moderator"] }
        }
      });
      
      if (!isCreator && !isModerator) {
        finalRole = "viewer";
      }
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.livestreamParticipant.findUnique({
      where: {
        userId_livestreamId: {
          userId,
          livestreamId
        }
      }
    });

    let participant;
    
    if (existingParticipant) {
      // Update existing participant
      participant = await prisma.livestreamParticipant.update({
        where: {
          id: existingParticipant.id
        },
        data: {
          role: finalRole,
          isActive: true,
          leftAt: null
        }
      });
    } else {
      // Create new participant
      participant = await prisma.livestreamParticipant.create({
        data: {
          role: finalRole,
          userId,
          livestreamId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "ლაივსტრიმში წარმატებით შეუერთდით",
      participant
    });
  } catch (error: any) {
    console.error("Error joining livestream:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმში შეერთების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}