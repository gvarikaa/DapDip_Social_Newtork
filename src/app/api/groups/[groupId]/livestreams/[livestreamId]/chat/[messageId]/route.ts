import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get a specific chat message
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string; messageId: string } }
) {
  try {
    const { groupId, livestreamId, messageId } = params;
    
    if (!groupId || !livestreamId || !messageId) {
      return NextResponse.json(
        { error: "ყველა იდენტიფიკატორი აუცილებელია" },
        { status: 400 }
      );
    }

    // Find message
    const message = await prisma.livestreamChat.findUnique({
      where: { 
        id: messageId
      },
      include: {
        _count: {
          select: { replies: true }
        }
      }
    });

    if (!message || message.livestreamId !== livestreamId) {
      return NextResponse.json(
        { error: "შეტყობინება ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Get user info if message has a sender
    let user = null;
    if (message.senderId) {
      user = await prisma.user.findUnique({
        where: { id: message.senderId },
        select: {
          id: true,
          username: true,
          displayName: true,
          img: true,
          avatarProps: true
        }
      });
    }

    return NextResponse.json({
      message: {
        ...message,
        user
      }
    });
  } catch (error: any) {
    console.error("Error fetching chat message:", error);
    return NextResponse.json(
      { error: "ჩატის შეტყობინების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Update a chat message
export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string; messageId: string } }
) {
  try {
    const { groupId, livestreamId, messageId } = params;
    
    if (!groupId || !livestreamId || !messageId) {
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

    // Find message
    const message = await prisma.livestreamChat.findUnique({
      where: { 
        id: messageId
      },
      include: {
        livestream: {
          select: {
            id: true,
            createdById: true,
            groupId: true
          }
        }
      }
    });

    if (!message || message.livestreamId !== livestreamId || message.livestream.groupId !== groupId) {
      return NextResponse.json(
        { error: "შეტყობინება ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions
    const isAuthor = message.senderId === userId;
    const isCreator = message.livestream.createdById === userId;
    const isModerator = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: { in: ["admin", "moderator"] }
      }
    });

    if (!isAuthor && !isCreator && !isModerator) {
      return NextResponse.json(
        { error: "შეტყობინების რედაქტირების უფლება არ გაქვთ" },
        { status: 403 }
      );
    }

    // Get request data
    const { message: messageText, isHighlighted, isDeleted } = await request.json();

    // Prepare update data
    const updateData: any = {};
    
    // Authors can only edit message content
    if (isAuthor && !isCreator && !isModerator) {
      if (messageText !== undefined) updateData.message = messageText;
    } else {
      // Creators and moderators can do more
      if (messageText !== undefined) updateData.message = messageText;
      if (isHighlighted !== undefined) updateData.isHighlighted = isHighlighted;
      if (isDeleted !== undefined) updateData.isDeleted = isDeleted;
    }

    // If nothing is changing
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "განახლებისთვის საჭიროა მინიმუმ ერთი პარამეტრი" },
        { status: 400 }
      );
    }

    // Update message
    const updatedMessage = await prisma.livestreamChat.update({
      where: { id: messageId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
  } catch (error: any) {
    console.error("Error updating chat message:", error);
    return NextResponse.json(
      { error: "ჩატის შეტყობინების განახლების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Delete a chat message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; livestreamId: string; messageId: string } }
) {
  try {
    const { groupId, livestreamId, messageId } = params;
    
    if (!groupId || !livestreamId || !messageId) {
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

    // Find message
    const message = await prisma.livestreamChat.findUnique({
      where: { 
        id: messageId
      },
      include: {
        livestream: {
          select: {
            id: true,
            createdById: true,
            groupId: true
          }
        }
      }
    });

    if (!message || message.livestreamId !== livestreamId || message.livestream.groupId !== groupId) {
      return NextResponse.json(
        { error: "შეტყობინება ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions
    const isAuthor = message.senderId === userId;
    const isCreator = message.livestream.createdById === userId;
    const isModerator = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: { in: ["admin", "moderator"] }
      }
    });

    if (!isAuthor && !isCreator && !isModerator) {
      return NextResponse.json(
        { error: "შეტყობინების წაშლის უფლება არ გაქვთ" },
        { status: 403 }
      );
    }

    // Check if this is a parent message with replies
    const hasReplies = await prisma.livestreamChat.count({
      where: {
        parentId: messageId
      }
    });

    if (hasReplies > 0) {
      // Soft delete if has replies (to maintain thread structure)
      await prisma.livestreamChat.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          message: "[შეტყობინება წაშლილია]"
        }
      });
    } else {
      // Hard delete if no replies
      await prisma.livestreamChat.delete({
        where: { id: messageId }
      });
    }

    return NextResponse.json({
      success: true,
      message: "შეტყობინება წარმატებით წაიშალა",
      softDelete: hasReplies > 0
    });
  } catch (error: any) {
    console.error("Error deleting chat message:", error);
    return NextResponse.json(
      { error: "ჩატის შეტყობინების წაშლის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}