// src/app/(board)/reels/page.tsx
import ReelsFeed from "@/components/Reels/ReelsFeed";
import { prisma } from "@/prisma";
import { auth } from "@/utils/supabase/auth";
import ReelsCategories from "@/components/Reels/ReelsCategories";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function ReelsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="p-4 bg-secondary rounded-lg text-center max-w-sm mx-auto">
          <h3 className="text-white text-lg font-bold mb-2">გაიარეთ ავტორიზაცია</h3>
          <p className="text-gray-300 mb-4">რილსების სანახავად საჭიროა ავტორიზაცია</p>
          <a href="/sign-in" className="px-4 py-2 bg-accent text-white rounded-full inline-block">შესვლა</a>
        </div>
      </div>
    );
  }

  // მივიღოთ პირველადი მონაცემები სერვერიდან
  const initialReels = await prisma.reel.findMany({
    where: { isPublished: true },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          img: true,
          avatarProps: true
        }
      },
      topics: true,
      hashtags: { include: { hashtag: true } },
      _count: {
        select: {
          likes: true,
          comments: true,
          saves: true
        }
      },
      likes: { where: { userId }, select: { id: true } },
      saves: { where: { userId }, select: { id: true } }
    }
  });

  // მივიღოთ კატეგორიები
  const categories = await prisma.reelCategory.findMany({
    include: {
      _count: { select: { reels: true } }
    }
  });

  const initialData = {
    reels: initialReels,
    hasMore: initialReels.length === 5,
    page: 1
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* კატეგორიების ნავიგაცია */}
      <div className="bg-background border-b border-borderGray-dark py-2 sticky top-0 z-20">
        <ReelsCategories categories={categories} />
      </div>
      
      {/* ატვირთვის ღილაკი - მობილურზე ქვემოთ მარჯვნივ ფიქსირებული, დესკტოპზე ზემოთ მარჯვნივ */}
      <Link
        href="/reels/upload"
        className="fixed bottom-6 right-6 z-30 lg:absolute lg:bottom-auto lg:top-2 lg:right-4 bg-accent hover:bg-accent-light text-white p-3 rounded-full shadow-lg transform transition-transform hover:scale-110 active:scale-95"
        title="ახალი რილსის ატვირთვა"
      >
        <PlusCircle size={24} />
        <span className="sr-only">ახალი რილსის ატვირთვა</span>
      </Link>
      
      {/* რილსების ფიდი */}
      <div className="flex-1 overflow-hidden">
        <ReelsFeed initialData={initialData} />
      </div>
    </div>
  );
}