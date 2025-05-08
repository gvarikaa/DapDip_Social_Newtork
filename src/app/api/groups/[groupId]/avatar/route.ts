// src/app/api/groups/[groupId]/avatar/route.ts
import { prisma } from "@/prisma";
import { uploadFileToBunny } from "@/bunnyUtils";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/server";

// მომხმარებლის უფლებების შემოწმების ფუნქცია
async function checkUserPermission(groupId: string, userId: string) {
  try {
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
      console.error(`Group not found: ${groupId}`);
      return { error: "ჯგუფი ვერ მოიძებნა", status: 404 };
    }

    console.log(`Check permission for user ${userId} in group ${groupId}. Creator: ${group.creatorId}, Members: ${group.members.length}`);
    
    // შემოწმება: არის თუ არა მომხმარებელი ჯგუფის შემქმნელი ან ადმინისტრატორი/მოდერატორი
    const hasPermission = group.creatorId === userId || group.members.some(member => member.userId === userId);
    
    if (!hasPermission) {
      console.error(`Permission denied for user ${userId} in group ${groupId}`);
      return { error: "თქვენ არ გაქვთ ჯგუფის აიქონის შეცვლის უფლება", status: 403 };
    }

    return { group, hasPermission: true };
  } catch (error) {
    console.error("Error in checkUserPermission:", error);
    return { error: "უფლებების შემოწმებისას დაფიქსირდა შეცდომა", status: 500 };
  }
}

// ჯგუფის აიქონის ატვირთვა
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log("Avatar upload API started");
    const { groupId } = params;
    
    if (!groupId) {
      console.error("Missing groupId parameter");
      return NextResponse.json(
        { error: "ჯგუფის იდენტიფიკატორი აუცილებელია" },
        { status: 400 }
      );
    }
    
    console.log(`Processing avatar upload for group: ${groupId}`);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.error("No authenticated user found in session");
      return NextResponse.json(
        { error: "ავტორიზაცია საჭიროა" },
        { status: 401 }
      );
    }
    
    console.log(`Authenticated user: ${userId}`);

    // მომხმარებლის უფლებების შემოწმება
    console.log(`Checking permissions for user ${userId} in group ${groupId}`);
    const permissionCheck = await checkUserPermission(groupId, userId);
    if (!permissionCheck.hasPermission) {
      console.error(`Permission check failed: ${permissionCheck.error}`);
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }
    
    console.log("Permission check passed successfully");

    let file: File;
    let buffer: Buffer;
    let fileName: string;
    let currentGroup: { icon: string } | null = null;
    let uploadResult: { success: boolean, url: string, statusCode: number } = {
      success: false,
      url: "",
      statusCode: 0
    };
    
    try {
      const formData = await request.formData();
      console.log("FormData received");
      
      file = formData.get('file') as File;
      
      if (!file) {
        console.error("No file found in form data");
        return NextResponse.json(
          { error: "ფაილი არ არის მითითებული" },
          { status: 400 }
        );
      }
      
      console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // ფაილის ზომის შემოწმება - მაქს 2MB
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_FILE_SIZE) {
        console.error(`File too large: ${file.size} bytes`);
        return NextResponse.json(
          { error: "ფაილი ძალიან დიდია. მაქსიმალური ზომაა 2MB" },
          { status: 400 }
        );
      }
      
      // ფაილის ტიპის შემოწმება
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        console.error(`Invalid file type: ${file.type}`);
        return NextResponse.json(
          { error: "დაუშვებელი ფაილის ტიპი. დაშვებულია მხოლოდ JPEG, PNG, GIF, WEBP და SVG" },
          { status: 400 }
        );
      }
      
      console.log("File validation passed successfully");
      
      // ფაილის ბუფერად გარდაქმნა
      console.log("Converting file to buffer");
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      
      // უნიკალური ფაილის სახელის შექმნა
      const fileId = uuidv4();
      fileName = `${fileId}_${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
      console.log(`Generated unique filename: ${fileName}`);
      
      // ჯგუფის მიმდინარე აიქონი
      console.log(`Fetching current group icon for group: ${groupId}`);
      currentGroup = await prisma.group.findUnique({
        where: { id: groupId },
        select: { icon: true }
      });
      
      console.log(`Current group icon: ${currentGroup?.icon || 'none'}`);
      
      // ფაილის ატვირთვა Bunny.net-ზე groups/avatars დირექტორიაში
      console.log("Uploading file to Bunny.net");
      uploadResult = await uploadFileToBunny(buffer, fileName, "groups/avatars");
      console.log(`Upload result: ${JSON.stringify(uploadResult)}`);
      
      if (!uploadResult.success) {
        console.error(`Bunny.net upload failed with status: ${uploadResult.statusCode}`);
        return NextResponse.json(
          { error: "ფაილის ატვირთვა ვერ მოხერხდა", details: `Status code: ${uploadResult.statusCode}` },
          { status: 500 }
        );
      }
      
      // ჯგუფის განახლება მონაცემთა ბაზაში
      console.log(`Updating group ${groupId} with new icon: ${uploadResult.url}`);
      await prisma.group.update({
        where: { id: groupId },
        data: { icon: uploadResult.url }
      });
      
      // ძველი აიქონის წაშლა (თუ არსებობს და არ არის სისტემური)
      const oldIconUrl = currentGroup?.icon;
      if (oldIconUrl && oldIconUrl.includes("dapdip.b-cdn.net") && !oldIconUrl.startsWith("/")) {
        try {
          console.log(`Attempting to delete old icon: ${oldIconUrl}`);
          // წავშალოთ ძველი ფაილი Bunny-დან
          const { deleteFileFromBunny } = await import("@/bunnyUtils");
          await deleteFileFromBunny(oldIconUrl);
          console.log("Old icon deleted successfully");
        } catch (error) {
          console.error("Failed to delete old icon image:", error);
          // არ გამოვიწვიოთ შეცდომა, თუ წაშლა ვერ მოხერხდა
        }
      }
      
    } catch (formError) {
      console.error("Error processing form data or file:", formError);
      return NextResponse.json(
        { error: "ფაილის დამუშავების შეცდომა", details: formError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: "ჯგუფის აიქონი ატვირთულია",
      iconUrl: uploadResult.url
    });
  } catch (error: any) {
    console.error("ჯგუფის აიქონის ატვირთვის შეცდომა:", error);
    return NextResponse.json(
      { error: "სერვერის შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}