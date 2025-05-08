import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { imagekit } from "@/utils";
import { auth } from "@/utils/supabase/auth";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();

    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;
    const job = formData.get("job") as string;
    const gender = formData.get("gender") as string;

    const avatarFile = formData.get("avatar") as File | null;
    const coverFile = formData.get("cover") as File | null;

    const updateData: any = {
      displayName,
      bio,
      location,
      website,
      job,
      gender
    };

    if (avatarFile && avatarFile.size > 0) {
      const avatarBytes = await avatarFile.arrayBuffer();
      const avatarBuffer = Buffer.from(avatarBytes);

      const avatarResult = await uploadToImageKit(avatarBuffer, avatarFile.name, "avatars");

      if (avatarResult && avatarResult.filePath) {
        updateData.img = avatarResult.filePath;
      }
    }

    if (coverFile && coverFile.size > 0) {
      const coverBytes = await coverFile.arrayBuffer();
      const coverBuffer = Buffer.from(coverBytes);

      const coverResult = await uploadToImageKit(coverBuffer, coverFile.name, "covers");

      if (coverResult && coverResult.filePath) {
        updateData.cover = coverResult.filePath;
      }
    }

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

async function uploadToImageKit(fileBuffer: Buffer, fileName: string, folder: string): Promise<any> {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: fileBuffer,
        fileName: fileName,
        folder: `/${folder}`,
        transformation: {
          pre: folder === "avatars"
            ? "w-400,h-400,c-maintain_ratio,fo-auto"
            : "w-1200,h-400,c-maintain_ratio,fo-auto"
        }
      },
      function (error, result) {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}