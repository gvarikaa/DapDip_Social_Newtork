// src/app/(board)/reels/upload/page.tsx
import ReelsUpload from "@/components/Reels/ReelsUpload";
import { auth } from "@/utils/supabase/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma";
import { ReelCategory } from "@prisma/client"; // დავამატეთ იმპორტი

export default async function UploadReelPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // მივიღოთ კატეგორიები
  const categories = await prisma.reelCategory.findMany();

  return (
    <div className="min-h-screen bg-background pt-8 pb-16 h-full overflow-y-auto">
<ReelsUpload categories={categories} />
    </div>
  );
}