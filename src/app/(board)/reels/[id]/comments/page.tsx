// src/app/(board)/reels/[id]/comments/page.tsx
import { prisma } from "@/prisma";
import { auth } from "@/utils/supabase/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import ProfileAvatar from "@/components/Avatar/ProfileAvatar";
import ReelComments from "@/components/Reels/ReelComments";

interface CommentsPageProps {
  params: {
    id: string;
  };
}

export default async function ReelCommentsPage({ params }: CommentsPageProps) {
  const { userId } = await auth();
  const { id } = params;

  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="p-4 bg-secondary rounded-lg text-center max-w-sm mx-auto">
          <h3 className="text-white text-lg font-bold mb-2">გაიარეთ ავტორიზაცია</h3>
          <p className="text-gray-300 mb-4">კომენტარების სანახავად საჭიროა ავტორიზაცია</p>
          <a href="/sign-in" className="px-4 py-2 bg-accent text-white rounded-full inline-block">შესვლა</a>
        </div>
      </div>
    );
  }

  // მოვიძიოთ რილსი
  const reel = await prisma.reel.findUnique({
    where: { id },
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
      comments: {
        where: { parentId: null }, // მხოლოდ მშობელი კომენტარები
        orderBy: { createdAt: 'desc' },
        take: 20,
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
          _count: {
            select: { 
              likes: true,
              replies: true // რეალურად parentId-ის მქონე კომენტარების რაოდენობა
            }
          },
          likes: {
            where: { userId },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!reel) {
    notFound();
  }

  // მივიღოთ მომხმარებლის ინფორმაცია კომენტარების დასამატებლად
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      img: true,
      avatarProps: true
    }
  });

  if (!currentUser) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ზედა ნავიგაცია */}
      <div className="sticky top-0 z-10 bg-background border-b border-borderGray-dark p-4 flex items-center">
        <Link 
          href={`/reels/${id}`} 
          className="p-2 rounded-full hover:bg-secondary transition-colors text-gray-300"
          aria-label="უკან დაბრუნება"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="ml-2 text-lg font-bold text-white">კომენტარები</h1>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4">
        {/* რილსის მოკლე ინფორმაცია */}
        <div className="bg-secondary-dark rounded-lg overflow-hidden shadow-card mb-4 p-4">
          <div className="flex items-center gap-3">
            <Link href={`/${reel.user.username}`}>
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <ProfileAvatar
                  imageUrl={reel.user.img}
                  username={reel.user.username}
                  avatarProps={reel.user.avatarProps}
                  size="sm"
                />
              </div>
            </Link>
            <div className="flex-1">
              <Link 
                href={`/${reel.user.username}`}
                className="text-white font-bold hover:underline"
              >
                {reel.user.displayName || reel.user.username}
              </Link>
              {reel.title && (
                <p className="text-gray-300 text-sm truncate">{reel.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* კომენტარების სია */}
        <ReelComments 
          reelId={id} 
          initialComments={reel.comments} 
          currentUser={currentUser} 
        />
      </div>
    </div>
  );
}