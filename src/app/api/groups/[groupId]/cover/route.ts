// src/app/api/groups/[groupId]/cover/route.ts
import { prisma } from "@/prisma";
import { uploadFileToBunny } from "@/bunnyUtils";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/server";

// მომხმარებლის უფლებების შემოწმების ფუნქცია
async function checkUserPermission(groupId: string, userId: string) {
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
    return { error: "ჯგუფი ვერ მოიძებნა", status: 404 };
  }

  // შემოწმება: არის თუ არა მომხმარებელი ჯგუფის შემქმნელი ან ადმინისტრატორი
  const hasPermission = group.creatorId === userId || group.members.some(member => member.userId === userId);
  
  if (!hasPermission) {
    return { error: "თქვენ არ გაქვთ ჯგუფის ქავერის შეცვლის უფლება", status: 403 };
  }

  return { group, hasPermission: true };
}

// ჯგუფის ქავერის ატვირთვა
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

    // მომხმარებლის უფლებების შემოწმება
    const permissionCheck = await checkUserPermission(groupId, userId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "ფაილი არ არის მითითებული" },
        { status: 400 }
      );
    }
    
    // ფაილის ზომის შემოწმება - მაქს 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ფაილი ძალიან დიდია. მაქსიმალური ზომაა 5MB" },
        { status: 400 }
      );
    }
    
    // ფაილის ტიპის შემოწმება
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "დაუშვებელი ფაილის ტიპი. დაშვებულია მხოლოდ JPEG, PNG, GIF და WEBP" },
        { status: 400 }
      );
    }
    
    // ფაილის ბუფერად გარდაქმნა
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // უნიკალური ფაილის სახელის შექმნა
    const fileId = uuidv4();
    const fileName = `${fileId}_${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
    
    // ჯგუფის მიმდინარე სურათი
    const currentGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: { coverImage: true }
    });
    
    // ფაილის ატვირთვა Bunny.net-ზე groups/covers დირექტორიაში
    const uploadResult = await uploadFileToBunny(buffer, fileName, "groups/covers");
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: "ფაილის ატვირთვა ვერ მოხერხდა" },
        { status: 500 }
      );
    }
    
    // ჯგუფის განახლება
    await prisma.group.update({
      where: { id: groupId },
      data: { coverImage: uploadResult.url }
    });
    
    // ძველი სურათის წაშლა (თუ არსებობს და არ არის სისტემური)
    const oldCoverUrl = currentGroup?.coverImage;
    if (oldCoverUrl && oldCoverUrl.includes("dapdip.b-cdn.net") && !oldCoverUrl.includes("gradients") && !oldCoverUrl.startsWith("/")) {
      try {
        // წავშალოთ ძველი ფაილი Bunny-დან
        const { deleteFileFromBunny } = await import("@/bunnyUtils");
        await deleteFileFromBunny(oldCoverUrl);
      } catch (error) {
        console.error("Failed to delete old cover image:", error);
        // არ გამოვიწვიოთ შეცდომა, თუ წაშლა ვერ მოხერხდა
      }
    }
    
    return NextResponse.json({ 
      message: "ჯგუფის ქავერი ატვირთულია",
      coverUrl: uploadResult.url
    });
  } catch (error: any) {
    console.error("ჯგუფის ქავერის ატვირთვის შეცდომა:", error);
    return NextResponse.json(
      { error: "სერვერის შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფის ქავერის ტიპის/URL-ის განახლება
export async function PUT(
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

    // მომხმარებლის უფლებების შემოწმება
    const permissionCheck = await checkUserPermission(groupId, userId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }
    
    const body = await request.json();
    const { coverType, coverUrl } = body;
    
    // ჯგუფის განახლება
    await prisma.group.update({
      where: { id: groupId },
      data: { 
        coverImage: coverUrl,
        // შეგიძლიათ შეინახოთ coverType თუ დაგჭირდებათ
      }
    });
    
    return NextResponse.json({ 
      message: "ჯგუფის ქავერი განახლებულია",
      coverUrl
    });
  } catch (error: any) {
    console.error("ჯგუფის ქავერის განახლების შეცდომა:", error);
    return NextResponse.json(
      { error: "სერვერის შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}