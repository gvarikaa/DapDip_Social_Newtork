// src/app/api/users/[userId]/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  const requestedUserId = params.userId;

  try {
    // მომხმარებლის მოძიება
    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        img: true,
        bio: true,
        location: true,
        website: true,
        job: true,
        createdAt: true,
        followings: {
          where: { followerId: currentUserId },
          select: { id: true }
        },
        _count: {
          select: {
            followers: true,
            followings: true,
            posts: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "მომხმარებელი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // ამოვიღოთ უახლესი სტატუსი (ბოლო პოსტი)
    const latestPost = await prisma.post.findFirst({
      where: {
        userId: requestedUserId,
        parentPostId: null, // არა კომენტარი
        rePostId: null // არა რეპოსტი
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        desc: true,
        createdAt: true
      }
    });

    // დავაფორმატოთ მონაცემები
    const formattedUser = {
      ...user,
      isFollowed: user.followings.length > 0,
      followings: undefined, // არ გავამჟღავნოთ სრული სია
      latestPost: latestPost ? {
        id: latestPost.id,
        content: latestPost.desc,
        createdAt: latestPost.createdAt
      } : null
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("მომხმარებლის მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "მომხმარებლის მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}