import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get livestream details
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
          { error: "პრივატული ჯგუფის ლაივსტრიმის სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      if (group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის ლაივსტრიმის ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // Find livestream
    const livestream = await prisma.groupLivestream.findUnique({
      where: { 
        id: livestreamId,
        groupId 
      },
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
        participants: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                img: true
              }
            }
          },
          orderBy: {
            role: "asc" // hosts first
          }
        },
        _count: {
          select: {
            views: true,
            participants: true,
            chats: true
          }
        }
      }
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ლაივსტრიმი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check if user can view this livestream
    const isPublicOrMembersOnly = livestream.visibility === "public" || livestream.visibility === "members_only";
    const isCreator = userId === livestream.createdById;
    const isModerator = group.members.some(member => 
      member.role === "admin" || member.role === "moderator"
    );
    const isMember = group.members.length > 0;

    if (!isPublicOrMembersOnly && !isCreator && !isModerator) {
      return NextResponse.json(
        { error: "ამ ლაივსტრიმის ნახვის უფლება არ გაქვთ" },
        { status: 403 }
      );
    }

    if (livestream.visibility === "members_only" && !isMember) {
      return NextResponse.json(
        { error: "ამ ლაივსტრიმის ნახვისთვის საჭიროა ჯგუფის წევრობა" },
        { status: 403 }
      );
    }

    // Record a view if authenticated
    if (userId) {
      const activeViews = await prisma.livestreamView.findMany({
        where: {
          livestreamId,
          userId,
          endTime: null
        }
      });

      // If no active view, create one
      if (activeViews.length === 0) {
        await prisma.livestreamView.create({
          data: {
            startTime: new Date(),
            userId,
            livestreamId,
            deviceType: request.headers.get("user-agent")?.includes("Mobile") ? "mobile" : "desktop"
          }
        });
      }
    }

    // Get user participant record if available
    const userParticipant = userId ? 
      await prisma.livestreamParticipant.findUnique({
        where: {
          userId_livestreamId: {
            userId,
            livestreamId
          }
        }
      }) : null;

    // Process response data
    const responseData = {
      ...livestream,
      currentViewers: await prisma.livestreamView.count({
        where: {
          livestreamId,
          endTime: null
        }
      }),
      userRole: userParticipant?.role || "viewer",
      canModerate: isCreator || isModerator,
      streamKey: isCreator || isModerator ? livestream.streamKey : undefined
    };

    return NextResponse.json({
      livestream: responseData,
      group: {
        id: group.id,
        name: group.name,
        type: group.type
      }
    });
  } catch (error: any) {
    console.error("Error fetching group livestream:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმის დეტალების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Update livestream details
export async function PATCH(
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
        group: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ["admin", "moderator"] }
              }
            }
          }
        }
      }
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ლაივსტრიმი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions (creator or moderator/admin)
    const isCreator = livestream.createdById === userId;
    const isModerator = livestream.group.members.length > 0;
    
    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ ლაივსტრიმის რედაქტირების უფლება" },
        { status: 403 }
      );
    }

    // Get request data
    const requestData = await request.json();
    const { 
      title,
      description,
      thumbnailUrl,
      status,
      visibility,
      scheduledStartTime,
      maxParticipants,
      settings
    } = requestData;

    // Prepare update data
    const updateData: any = {};

    // Basic info updates
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (settings !== undefined) updateData.settings = settings;
    if (scheduledStartTime !== undefined) {
      updateData.scheduledStartTime = scheduledStartTime ? new Date(scheduledStartTime) : null;
    }

    // Handle status changes
    if (status !== undefined && status !== livestream.status) {
      updateData.status = status;
      
      // Additional actions based on status change
      switch (status) {
        case "live":
          if (!livestream.actualStartTime) {
            updateData.actualStartTime = new Date();
          }
          break;
        case "completed":
          updateData.endTime = new Date();
          updateData.duration = livestream.actualStartTime
            ? Math.ceil((Date.now() - new Date(livestream.actualStartTime).getTime()) / 60000)
            : null;
          break;
      }
    }

    // If nothing is changing
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "განახლებისთვის საჭიროა მინიმუმ ერთი პარამეტრი" },
        { status: 400 }
      );
    }

    // Update livestream
    const updatedLivestream = await prisma.groupLivestream.update({
      where: { id: livestreamId },
      data: updateData
    });

    // Special handling for completed livestreams
    if (status === "completed") {
      // Close all active views
      await prisma.livestreamView.updateMany({
        where: {
          livestreamId,
          endTime: null
        },
        data: {
          endTime: new Date()
        }
      });
      
      // Set all participants to inactive
      await prisma.livestreamParticipant.updateMany({
        where: {
          livestreamId,
          isActive: true
        },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "ლაივსტრიმი წარმატებით განახლდა",
      livestream: updatedLivestream
    });
  } catch (error: any) {
    console.error("Error updating group livestream:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმის განახლების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Delete livestream
export async function DELETE(
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
        group: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ["admin", "moderator"] }
              }
            }
          }
        }
      }
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ლაივსტრიმი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions (creator or moderator/admin)
    const isCreator = livestream.createdById === userId;
    const isModerator = livestream.group.members.length > 0;
    
    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ ლაივსტრიმის წაშლის უფლება" },
        { status: 403 }
      );
    }

    // Delete livestream (cascade will handle participants, views, and chats)
    await prisma.groupLivestream.delete({
      where: { id: livestreamId }
    });

    return NextResponse.json({
      success: true,
      message: "ლაივსტრიმი წარმატებით წაიშალა"
    });
  } catch (error: any) {
    console.error("Error deleting group livestream:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმის წაშლის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}