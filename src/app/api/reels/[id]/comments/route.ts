// src/app/api/reels/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";
import { socketMethods } from "@/socket";

// კომენტარების მიღება
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const reelId = params.id;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = Number(searchParams.get('limit') || '10');
  const parentId = searchParams.get('parentId');

  try {
    // შევქმნათ პირობა კომენტარების მოსაძებნად
    let whereCondition: any = {
      reelId
    };

    // თუ parentId მითითებულია, ვეძებთ პასუხებს; წინააღმდეგ შემთხვევაში, ვეძებთ მთავარ კომენტარებს
    if (parentId) {
      whereCondition.parentId = parentId;
    } else {
      whereCondition.parentId = null;
    }

    // თუ cursor მითითებულია, ვიწყებთ ამ კომენტარის შემდეგ
    if (cursor) {
      whereCondition.id = {
        lt: cursor // less than - პაგინაციისთვის
      };
    }

    // კომენტარების მოძიება
    const comments = await prisma.reelComment.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
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
            replies: parentId ? undefined : {
              where: {
                parentId: { not: null }
              }
            }
          }
        },
        likes: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    // შევამოწმოთ, კიდევ არის თუ არა კომენტარები
    const nextCursor = comments.length > 0 ? comments[comments.length - 1].id : null;
    
    const hasMore = nextCursor
      ? (await prisma.reelComment.count({
          where: {
            ...whereCondition,
            id: { lt: nextCursor }
          }
        })) > 0
      : false;

    // დავაბრუნოთ პასუხი
    return NextResponse.json({
      comments,
      hasMore,
      nextCursor
    });
  } catch (error) {
    console.error("კომენტარების მოძიების შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}

// კომენტარის დამატება
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const reelId = params.id;

  try {
    // შევამოწმოთ რილსის არსებობა
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      select: { 
        id: true,
        userId: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!reel) {
      return NextResponse.json({ error: "რილსი ვერ მოიძებნა" }, { status: 404 });
    }

    // მივიღოთ request body
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: "კომენტარი არ შეიძლება იყოს ცარიელი" }, { status: 400 });
    }

    // შევამოწმოთ parentId-ის არსებობა, თუ მითითებულია
    if (parentId) {
      const parentComment = await prisma.reelComment.findUnique({
        where: { id: parentId },
        select: { id: true, reelId: true }
      });

      if (!parentComment) {
        return NextResponse.json({ error: "მშობელი კომენტარი ვერ მოიძებნა" }, { status: 404 });
      }

      if (parentComment.reelId !== reelId) {
        return NextResponse.json({ error: "მშობელი კომენტარი არ ეკუთვნის ამ რილსს" }, { status: 400 });
      }
    }

    // შევქმნათ კომენტარი
    const comment = await prisma.reelComment.create({
      data: {
        content,
        reelId,
        userId,
        parentId
      },
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
            replies: parentId ? undefined : true
          }
        },
        likes: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    // გავაგზავნოთ ნოტიფიკაცია რილსის ავტორს, თუ კომენტარის ავტორი არ არის რილსის ავტორი
    if (reel.userId !== userId) {
      // მივიღოთ კომენტარის ავტორის მონაცემები
      const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, displayName: true, img: true }
      });

      if (commenter) {
        // გავაგზავნოთ ნოტიფიკაცია reel.user.username-ს
        socketMethods.sendNotification(reel.user.username, {
          senderUsername: commenter.username,
          senderDisplayName: commenter.displayName || undefined,
          senderImg: commenter.img || undefined,
          type: "comment",
          link: `/reels/${reelId}/comments`,
          metadata: {
            reelId,
            commentId: comment.id,
            commentText: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          }
        });
      }

      // თუ ეს არის პასუხი, ასევე გავაგზავნოთ ნოტიფიკაცია კომენტარის ავტორს
      if (parentId) {
        const parentCommentAuthor = await prisma.reelComment.findUnique({
          where: { id: parentId },
          select: {
            userId: true,
            user: {
              select: { username: true }
            }
          }
        });

        if (parentCommentAuthor && parentCommentAuthor.userId !== userId && commenter) {
          socketMethods.sendNotification(parentCommentAuthor.user.username, {
            senderUsername: commenter.username,
            senderDisplayName: commenter.displayName || undefined,
            senderImg: commenter.img || undefined,
            type: "comment",
            link: `/reels/${reelId}/comments`,
            metadata: {
              reelId,
              commentId: comment.id,
              parentCommentId: parentId,
              commentText: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              isReply: true
            }
          });
        }
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("კომენტარის დამატების შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}