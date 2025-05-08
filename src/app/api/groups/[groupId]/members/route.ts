import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// ჯგუფის წევრების სიის მიღება
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

    // ჯგუფის მოძიება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        isPrivate: true,
        members: userId && userId !== "" ? {
          where: { userId },
          select: { id: true }
        } : undefined
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
          { error: "პრივატული ჯგუფის წევრების სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი
      if (!group.members || group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის წევრების ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // URL პარამეტრების მიღება
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50); // მაქსიმუმ 50 წევრი
    const role = searchParams.get("role"); // 'admin', 'moderator', 'member'
    const search = searchParams.get("search"); // ძიება სახელით ან იუზერნეიმით

    // ფილტრაციის პირობების შექმნა
    const whereCondition: any = {
      groupId,
      isActive: true
    };
    
    if (role) {
      whereCondition.role = role;
    }

    // ძიების პირობების დამატება
    let userWhere = {};
    if (search) {
      userWhere = {
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } }
        ]
      };
    }

    // წევრების რაოდენობის მიღება პაგინაციისთვის
    const totalMembers = await prisma.groupMember.count({
      where: {
        ...whereCondition,
        user: userWhere
      }
    });

    // წევრების მიღება
    const members = await prisma.groupMember.findMany({
      where: {
        ...whereCondition,
        user: userWhere
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true,
            bio: true
          }
        }
      },
      orderBy: [
        { role: "asc" }, // დალაგება როლის მიხედვით - პირველ რიგში მოდერატორები
        { joinedAt: "desc" } // შემდეგ ახალ წევრები
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      members,
      pagination: {
        total: totalMembers,
        page,
        pageSize,
        totalPages: Math.ceil(totalMembers / pageSize)
      }
    });
  } catch (error: any) {
    console.error("Error fetching group members:", error);
    return NextResponse.json(
      { error: "ჯგუფის წევრების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფში გაწევრიანების მოთხოვნა
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

    // შევამოწმოთ, არის თუ არა უკვე წევრი
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "თქვენ უკვე ხართ ამ ჯგუფის წევრი" },
        { status: 400 }
      );
    }

    // შევამოწმოთ, არსებობს თუ არა უკვე მოთხოვნა
    const existingRequest = await prisma.groupMemberRequest.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (existingRequest && existingRequest.status === "pending") {
      return NextResponse.json(
        { error: "თქვენი მოთხოვნა უკვე გაგზავნილია და ელოდება დადასტურებას" },
        { status: 400 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { message } = requestData;

    // პრივატული და ღია ჯგუფებისთვის სხვადასხვა ლოგიკა
    if (group.isPrivate) {
      // პრივატული ჯგუფისთვის საჭიროა მოთხოვნის შექმნა
      const memberRequest = await prisma.groupMemberRequest.create({
        data: {
          userId,
          groupId,
          message: message || null
        }
      });

      return NextResponse.json({
        success: true,
        message: "გაწევრიანების მოთხოვნა წარმატებით გაიგზავნა",
        requestId: memberRequest.id,
        status: "pending"
      });
    } else {
      // ღია ჯგუფისთვის პირდაპირ ხდება გაწევრიანება
      const member = await prisma.groupMember.create({
        data: {
          userId,
          groupId,
          role: "member"
        }
      });

      return NextResponse.json({
        success: true,
        message: "წარმატებით გაწევრიანდით ჯგუფში",
        memberId: member.id
      });
    }
  } catch (error: any) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "ჯგუფში გაწევრიანების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}