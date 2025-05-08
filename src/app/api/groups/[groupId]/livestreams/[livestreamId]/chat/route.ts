import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get livestream chat messages
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

    // URL parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Default 50, max 100
    const cursor = searchParams.get("cursor"); // For pagination
    const parentId = searchParams.get("parentId"); // For getting replies to a specific message
    const type = searchParams.get("type"); // Optional filter by message type

    // Build query
    const filter: any = { 
      livestreamId,
      isDeleted: false,
    };
    
    // Parent filter for thread view
    if (parentId) {
      filter.parentId = parentId;
    } else {
      filter.parentId = null; // Only root messages by default
    }
    
    // Type filter
    if (type) {
      filter.type = type;
    }

    // Pagination query
    const messages = await prisma.livestreamChat.findMany({
      where: filter,
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // Skip the cursor itself
      orderBy: {
        createdAt: parentId ? "asc" : "desc" // Oldest first for threads, newest first for main chat
      },
      include: {
        _count: {
          select: { replies: true }
        }
      }
    });

    // Get user information for all messages with senders
    const userIds = messages
      .filter(msg => msg.senderId)
      .map(msg => msg.senderId as string);
    
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          img: true,
          avatarProps: true
        }
      });
      
      // Attach user data to messages
      const messagesWithUsers = messages.map(message => {
        if (!message.senderId) return message;
        
        const user = users.find(u => u.id === message.senderId);
        return {
          ...message,
          user
        };
      });
      
      return NextResponse.json({
        messages: messagesWithUsers,
        nextCursor: messages.length === limit ? messages[messages.length - 1].id : null
      });
    }

    return NextResponse.json({
      messages,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null
    });
  } catch (error: any) {
    console.error("Error fetching livestream chat:", error);
    return NextResponse.json(
      { error: "ლაივსტრიმის ჩატის მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Send a chat message
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
      }
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ლაივსტრიმი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check if livestream is active
    if (livestream.status !== "live") {
      return NextResponse.json(
        { error: "ჩატში შეტყობინების გაგზავნა შესაძლებელია მხოლოდ აქტიური ლაივსტრიმის დროს" },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const isParticipant = await prisma.livestreamParticipant.findUnique({
      where: {
        userId_livestreamId: {
          userId,
          livestreamId
        }
      }
    });

    if (!isParticipant || !isParticipant.isActive) {
      // Auto-join as viewer if not already a participant
      await prisma.livestreamParticipant.upsert({
        where: {
          userId_livestreamId: {
            userId,
            livestreamId
          }
        },
        update: {
          isActive: true,
          leftAt: null
        },
        create: {
          userId,
          livestreamId,
          role: "viewer"
        }
      });
    }

    // Get request data
    const { message, type = "text", parentId = null } = await request.json();

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: "შეტყობინების ტექსტი აუცილებელია" },
        { status: 400 }
      );
    }

    // If this is a reply, check if parent exists
    if (parentId) {
      const parentMessage = await prisma.livestreamChat.findUnique({
        where: { 
          id: parentId,
          livestreamId
        }
      });
      
      if (!parentMessage) {
        return NextResponse.json(
          { error: "ბმული შეტყობინება ვერ მოიძებნა" },
          { status: 404 }
        );
      }
      
      // Make sure we're not creating a reply to a reply (only 1 level deep)
      if (parentMessage.parentId) {
        return NextResponse.json(
          { error: "მხოლოდ ერთი დონის ჩაღრმავებაა დაშვებული" },
          { status: 400 }
        );
      }
    }

    // Create chat message
    const chatMessage = await prisma.livestreamChat.create({
      data: {
        message,
        type,
        parentId,
        senderId: userId,
        livestreamId
      }
    });

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        img: true,
        avatarProps: true
      }
    });

    return NextResponse.json({
      success: true,
      message: chatMessage,
      user
    });
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: "ჩატში შეტყობინების გაგზავნის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}