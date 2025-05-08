// src/app/(board)/reels/[id]/page.tsx
import { prisma } from "@/prisma";
import { auth } from "@/utils/supabase/auth";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2, Heart, MessageCircle, Bookmark } from "lucide-react";
import Link from "next/link";
import ProfileAvatar from "@/components/Avatar/ProfileAvatar";
import FormattedText from "@/components/PostMaker/FormattedText";

interface ReelPageProps {
  params: {
    id: string;
  };
}

export default async function ReelPage({ params }: ReelPageProps) {
  const { userId } = await auth();
  const { id } = params;

  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="p-4 bg-secondary rounded-lg text-center max-w-sm mx-auto">
          <h3 className="text-white text-lg font-bold mb-2">გაიარეთ ავტორიზაცია</h3>
          <p className="text-gray-300 mb-4">რილსის სანახავად საჭიროა ავტორიზაცია</p>
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

  if (!reel) {
    notFound();
  }

  // განვაახლოთ ნახვების რაოდენობა
  await prisma.reel.update({
    where: { id },
    data: { views: { increment: 1 } }
  });

  // შევამოწმოთ არის თუ არა მოწონებული/შენახული
  const isLiked = reel.likes.length > 0;
  const isSaved = reel.saves.length > 0;

  // დროის ფორმატირება
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* ზედა ნავიგაცია */}
      <div className="sticky top-0 z-10 bg-background border-b border-borderGray-dark p-4 flex items-center">
        <Link 
          href="/reels" 
          className="p-2 rounded-full hover:bg-secondary transition-colors text-gray-300"
          aria-label="უკან დაბრუნება"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="ml-2 text-lg font-bold text-white">რილსი</h1>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-secondary-dark rounded-lg overflow-hidden shadow-card">
          {/* ვიდეო კონტეინერი */}
          <div className="aspect-[9/16] sm:aspect-video w-full bg-black relative overflow-hidden">
            <video 
              src={reel.videoUrl}
              controls
              poster={reel.thumbnailUrl || undefined}
              className="w-full h-full object-contain"
              preload="metadata"
              playsInline
            />
          </div>

          {/* რილსის ინფორმაცია */}
          <div className="p-4">
            {/* ავტორი და სათაური */}
            <div className="flex items-start gap-3 mb-4">
              <Link 
                href={`/${reel.user.username}`}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <ProfileAvatar
                    imageUrl={reel.user.img}
                    username={reel.user.username}
                    avatarProps={reel.user.avatarProps}
                    size="md"
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
                  <h2 className="text-xl font-bold text-white mt-1">{reel.title}</h2>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  {formatDate(reel.createdAt)} • {reel.views} ნახვა
                </p>
              </div>
            </div>

            {/* აღწერა */}
            {reel.desc && (
              <div className="mb-4">
                <FormattedText text={reel.desc} />
              </div>
            )}

            {/* ჰეშთეგები */}
            {reel.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {reel.hashtags.map((h) => (
                  <Link 
                    key={h.hashtagId}
                    href={`/hashtag/${h.hashtag.name}`}
                    className="text-accent hover:underline text-sm"
                  >
                    #{h.hashtag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* ქმედებების ღილაკები */}
            <div className="flex items-center gap-6 border-t border-borderGray-dark pt-4">
              {/* ლაიქი (არ არის ინტერაქტიული ამ გვერდზე) */}
              <div className="flex items-center gap-2 text-gray-300">
                <Heart
                  className={isLiked ? "text-accent" : ""}
                  fill={isLiked ? "#ff0033" : "none"}
                  size={20}
                />
                <span className="text-sm">{reel._count.likes}</span>
              </div>

              {/* კომენტარი */}
              <Link
                href={`/reels/${reel.id}/comments`}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <MessageCircle size={20} />
                <span className="text-sm">{reel._count.comments}</span>
              </Link>

              {/* შენახვა */}
              <div className="flex items-center gap-2 text-gray-300">
                <Bookmark
                  className={isSaved ? "text-yellow-400" : ""}
                  fill={isSaved ? "#fbbf24" : "none"}
                  size={20}
                />
              </div>

              {/* გაზიარება */}
              <button
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => {
                  // კლიენტის მხარეს კოდი გაზიარებისთვის
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({
                      title: reel.title || `Reel by ${reel.user.displayName || reel.user.username}`,
                      text: reel.desc || '',
                      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/reels/${reel.id}`
                    }).catch(console.error);
                  } else {
                    // ფოლბეკი - კოპირება კლიპბორდში
                  }
                }}
              >
                <Share2 size={20} />
                <span className="text-sm">გაზიარება</span>
              </button>
            </div>
          </div>
        </div>

        {/* მსგავსი რილსების სექცია */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">მსგავსი რილსები</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* ამ ნაწილში შეგიძლიათ დაამატოთ მსგავსი რილსების ჩატვირთვის ლოგიკა */}
            <div className="aspect-[9/16] bg-secondary rounded-lg animate-pulse"></div>
            <div className="aspect-[9/16] bg-secondary rounded-lg animate-pulse hidden sm:block"></div>
            <div className="aspect-[9/16] bg-secondary rounded-lg animate-pulse hidden md:block"></div>
          </div>
        </div>
      </div>
    </div>
  );
}