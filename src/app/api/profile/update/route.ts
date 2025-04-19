// src/app/api/profile/update/route.ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { imagekit } from "@/utils";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    // მივიღოთ ფორმის მონაცემები
    const formData = await request.formData();
    
    // ამოვიღოთ ველები
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;
    const job = formData.get("job") as string;
    const gender = formData.get("gender") as string;
    
    // სურათების ფაილები
    const avatarFile = formData.get("avatar") as File | null;
    const coverFile = formData.get("cover") as File | null;
    
    // მოვამზადოთ განახლების მონაცემები Prisma-სთვის
    const updateData: any = {
      displayName,
      bio,
      location,
      website,
      job,
      gender
    };
    
    // სურათების ატვირთვა ImageKit-ზე
    if (avatarFile && avatarFile.size > 0) {
      const avatarBytes = await avatarFile.arrayBuffer();
      const avatarBuffer = Buffer.from(avatarBytes);
      
      // ავტვირთოთ ავატარი
      const avatarResult = await uploadToImageKit(avatarBuffer, avatarFile.name, "avatars");
      
      if (avatarResult && avatarResult.url) {
        updateData.img = avatarResult.filePath; // შევინახოთ ბაზაში ImageKit მისამართი
        
        // ასევე განვაახლოთ Clerk-ში პროფილის სურათი
        try {
          await clerkClient.users.updateUser(userId, {
            imageUrl: avatarResult.url
          });
        } catch (clerkError) {
          console.error("Error updating Clerk profile image:", clerkError);
        }
      }
    }
    
    if (coverFile && coverFile.size > 0) {
      const coverBytes = await coverFile.arrayBuffer();
      const coverBuffer = Buffer.from(coverBytes);
      
      // ავტვირთოთ ქავერი
      const coverResult = await uploadToImageKit(coverBuffer, coverFile.name, "covers");
      
      if (coverResult && coverResult.url) {
        updateData.cover = coverResult.filePath; // შევინახოთ ბაზაში ImageKit მისამართი
        
        // ასევე შევინახოთ Clerk-ის unsafeMetadata-ში (ოფციონალურია)
        try {
          await clerkClient.users.updateUser(userId, {
            unsafeMetadata: {
              cover: coverResult.url
            }
          });
        } catch (clerkError) {
          console.error("Error updating Clerk metadata:", clerkError);
        }
      }
    }
    
    // განვაახლოთ მომხმარებელი Prisma-ში
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("პროფილის განახლების შეცდომა:", error);
    return NextResponse.json(
      { error: "პროფილის განახლება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}

// დამხმარე ფუნქცია ImageKit-ზე ფაილის ასატვირთად
async function uploadToImageKit(fileBuffer: Buffer, fileName: string, folder: string) {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: fileBuffer,
        fileName: fileName,
        folder: `/${folder}`,
        transformation: {
          pre: folder === "avatars" ? "w-400,h-400,c-maintain_ratio,fo-auto" : "w-1200,h-400,c-maintain_ratio,fo-auto"
        }
      },
      function (error, result) {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}