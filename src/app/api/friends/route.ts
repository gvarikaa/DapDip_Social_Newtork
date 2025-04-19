// src/app/api/friends/route.ts
import { prisma } from "@/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "მომხმარებელი არ არის ავტორიზებული" },
      { status: 401 }
    );
  }

  try {
    // მივიღოთ ვისაც იუზერი ადევნებს თვალყურს (followings)
    const followings = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
          },
        },
      },
    });

    // დავაბრუნოთ მხოლოდ მეგობრების მონაცემები
    const friends = followings.map((follow) => follow.following);

    return NextResponse.json(friends);
  } catch (error) {
    console.error("მეგობრების მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "მეგობრების მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}