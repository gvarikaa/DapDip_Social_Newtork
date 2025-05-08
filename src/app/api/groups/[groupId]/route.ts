import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// ჯგუფის დეტალების მიღება
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

    // ჯგუფის დეტალების მიღება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        members: {
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
          }
        },
        categories: {
          orderBy: { priority: "asc" }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // პრივატული ჯგუფის შემთხვევაში ვამოწმებთ წევრობას
    if (group.isPrivate) {
      // შევამოწმოთ, არის თუ არა მომხმარებელი ავტორიზებული
      if (!userId) {
        return NextResponse.json(
          { error: "პრივატული ჯგუფის სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი
      const isMember = group.members.some(member => member.userId === userId);
      
      if (!isMember) {
        return NextResponse.json(
          { error: "ამ ჯგუფის ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // ჯგუფის წევრობის სტატუსი (ავტორიზებული მომხმარებლისთვის)
    let membership = null;
    if (userId) {
      const memberRecord = group.members.find(member => member.userId === userId);
      if (memberRecord) {
        membership = {
          role: memberRecord.role,
          joinedAt: memberRecord.joinedAt,
          id: memberRecord.id
        };
      }
    }

    // წაშალეთ მგრძნობიარე ინფორმაცია
    const safeGroup = {
      ...group,
      members: group.members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        isActive: member.isActive,
        user: member.user
      }))
    };

    return NextResponse.json({
      group: safeGroup,
      membership
    });
  } catch (error: any) {
    console.error("Error fetching group details:", error);
    return NextResponse.json(
      { error: "ჯგუფის დეტალების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფის განახლება
export async function PATCH(
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

    // ჯგუფის მოძიება და უფლებების შემოწმება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: {
            userId,
            role: { in: ["admin", "moderator"] }
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // უფლებების შემოწმება (მხოლოდ შემქმნელს ან ადმინს შეუძლია ჯგუფის რედაქტირება)
    const hasEditPermission = group.creatorId === userId || group.members.length > 0;
    
    if (!hasEditPermission) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ჯგუფის რედაქტირების უფლება" },
        { status: 403 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { 
      name, 
      description, 
      coverImage, 
      icon,
      isPrivate,
      moderationMode
    } = requestData;

    // განახლებისთვის საჭირო მონაცემების მომზადება
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (icon !== undefined) updateData.icon = icon;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (moderationMode !== undefined) updateData.moderationMode = moderationMode;

    // განახლება
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "ჯგუფი წარმატებით განახლდა",
      group: updatedGroup
    });
  } catch (error: any) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "ჯგუფის განახლების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფის წაშლა
export async function DELETE(
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

    // ჯგუფის მოძიება
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // უფლებების შემოწმება (მხოლოდ შემქმნელს შეუძლია ჯგუფის წაშლა)
    if (group.creatorId !== userId) {
      return NextResponse.json(
        { error: "მხოლოდ ჯგუფის შემქმნელს შეუძლია მისი წაშლა" },
        { status: 403 }
      );
    }

    // ჯგუფის წაშლა (კასკადური წაშლა მოხდება პრიზმას მიერ)
    await prisma.group.delete({
      where: { id: groupId }
    });

    return NextResponse.json({
      success: true,
      message: "ჯგუფი წარმატებით წაიშალა"
    });
  } catch (error: any) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "ჯგუფის წაშლის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}