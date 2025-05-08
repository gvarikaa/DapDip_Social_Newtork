import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get participant details
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string; participantId: string } }
) {
  try {
    const { groupId, livestreamId, participantId } = params;
    
    if (!groupId || !livestreamId || !participantId) {
      return NextResponse.json(
        { error: "ყველა იდენტიფიკატორი აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Find participant
    const participant = await prisma.livestreamParticipant.findUnique({
      where: { 
        id: participantId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        livestream: {
          select: {
            createdById: true,
            groupId: true,
            status: true
          }
        }
      }
    });

    if (!participant || participant.livestream.groupId !== groupId || participant.livestreamId !== livestreamId) {
      return NextResponse.json(
        { error: "მონაწილე ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      participant
    });
  } catch (error: any) {
    console.error("Error fetching participant details:", error);
    return NextResponse.json(
      { error: "მონაწილის დეტალების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Update participant (change role or status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string; participantId: string } }
) {
  try {
    const { groupId, livestreamId, participantId } = params;
    
    if (!groupId || !livestreamId || !participantId) {
      return NextResponse.json(
        { error: "ყველა იდენტიფიკატორი აუცილებელია" },
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

    // Find participant
    const participant = await prisma.livestreamParticipant.findUnique({
      where: { 
        id: participantId
      },
      include: {
        livestream: {
          select: {
            id: true,
            createdById: true,
            groupId: true,
            status: true
          }
        }
      }
    });

    if (!participant || participant.livestream.groupId !== groupId || participant.livestreamId !== livestreamId) {
      return NextResponse.json(
        { error: "მონაწილე ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions
    const isCreator = userId === participant.livestream.createdById;
    const isModerator = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: { in: ["admin", "moderator"] }
      }
    });
    const isTargetUser = userId === participant.userId;

    if (!isCreator && !isModerator && !isTargetUser) {
      return NextResponse.json(
        { error: "მონაწილის განახლების უფლება არ გაქვთ" },
        { status: 403 }
      );
    }

    // Get request data
    const requestData = await request.json();
    const { role, isActive } = requestData;

    // Prepare update data
    const updateData: any = {};
    
    // Users can only update their own active status, not role
    if (isTargetUser && !isCreator && !isModerator) {
      if (isActive !== undefined) {
        updateData.isActive = isActive;
        if (isActive === false) {
          updateData.leftAt = new Date();
        }
      }
    } else {
      // Creators and moderators can update everything
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) {
        updateData.isActive = isActive;
        if (isActive === false) {
          updateData.leftAt = new Date();
        }
      }
    }

    // If nothing is changing
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "განახლებისთვის საჭიროა მინიმუმ ერთი პარამეტრი" },
        { status: 400 }
      );
    }

    // Update participant
    const updatedParticipant = await prisma.livestreamParticipant.update({
      where: { id: participantId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "მონაწილე წარმატებით განახლდა",
      participant: updatedParticipant
    });
  } catch (error: any) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "მონაწილის განახლების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Remove participant from livestream
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string; participantId: string } }
) {
  try {
    const { groupId, livestreamId, participantId } = params;
    
    if (!groupId || !livestreamId || !participantId) {
      return NextResponse.json(
        { error: "ყველა იდენტიფიკატორი აუცილებელია" },
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

    // Find participant
    const participant = await prisma.livestreamParticipant.findUnique({
      where: { 
        id: participantId
      },
      include: {
        livestream: {
          select: {
            createdById: true,
            groupId: true
          }
        }
      }
    });

    if (!participant || participant.livestream.groupId !== groupId || participant.livestreamId !== livestreamId) {
      return NextResponse.json(
        { error: "მონაწილე ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions
    const isCreator = userId === participant.livestream.createdById;
    const isModerator = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: { in: ["admin", "moderator"] }
      }
    });
    const isTargetUser = userId === participant.userId;

    if (!isCreator && !isModerator && !isTargetUser) {
      return NextResponse.json(
        { error: "მონაწილის წაშლის უფლება არ გაქვთ" },
        { status: 403 }
      );
    }

    // Delete participant (user removing themselves) or mark as inactive (admin removing)
    if (isTargetUser) {
      // User removing themselves from livestream completely
      await prisma.livestreamParticipant.delete({
        where: { id: participantId }
      });
    } else {
      // Admin/mod removing a user (keep record but mark inactive)
      await prisma.livestreamParticipant.update({
        where: { id: participantId },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "მონაწილე წარმატებით გაუქმდა"
    });
  } catch (error: any) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "მონაწილის წაშლის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}