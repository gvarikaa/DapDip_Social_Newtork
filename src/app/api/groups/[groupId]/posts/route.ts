import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// ჯგუფის პოსტების სიის მიღება
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    if (!groupId) {
      return NextResponse.json(
        { error: "ჯგუფის იდენტიფიკატორი აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // ჯგუფის მოძიება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // პრივატული ჯგუფის შემთხვევაში ვამოწმებთ წევრობას
    if (group.isPrivate) {
      // შევამოწმოთ, არის თუ არა მომხმარებელი ავტორიზებული
      if (!userId) {
        return NextResponse.json(
          { error: "პრივატული ჯგუფის პოსტების სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი
      if (group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის პოსტების ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // URL პარამეტრების მიღება
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50); // მაქსიმუმ 50
    const sortBy = searchParams.get("sort") || "latest"; // 'latest', 'popular', 'active'

    // ფილტრაციის პირობების შექმნა
    const whereCondition: any = {
      groupId,
      isPending: false // მხოლოდ დადასტურებული პოსტები
    };

    // სორტირების კრიტერიუმის მიხედვით orderBy-ის მომზადება
    let orderBy: any = {};
    switch (sortBy) {
      case "popular":
        // პოპულარული პოსტები - რეაქციების რაოდენობის მიხედვით
        orderBy = {
          reactions: {
            _count: "desc"
          }
        };
        break;
      case "active":
        // აქტიური პოსტები - ბოლო კომენტარების მიხედვით
        orderBy = {
          comments: {
            _count: "desc"
          }
        };
        break;
      case "latest":
      default:
        // უახლესი პოსტები (ნაგულისხმევი)
        orderBy = {
          createdAt: "desc"
        };
        break;
    }

    // პოსტების რაოდენობის მიღება პაგინაციისთვის
    const totalPosts = await prisma.groupPost.count({
      where: whereCondition
    });

    // პოსტების მიღება
    const posts = await prisma.groupPost.findMany({
      where: whereCondition,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        analysis: {
          include: {
            category: true
          }
        },
        media: true,
        _count: {
          select: {
            comments: true,
            reactions: true
          }
        },
        reactions: userId ? {
          where: { userId },
          select: { id: true, type: true }
        } : undefined
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      posts,
      pagination: {
        total: totalPosts,
        page,
        pageSize,
        totalPages: Math.ceil(totalPosts / pageSize)
      }
    });
  } catch (error: any) {
    console.error("Error fetching group posts:", error);
    return NextResponse.json(
      { error: "ჯგუფის პოსტების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფში ახალი პოსტის დამატება
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    if (!groupId) {
      return NextResponse.json(
        { error: "ჯგუფის იდენტიფიკატორი აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ავტორიზაცია საჭიროა" },
        { status: 401 }
      );
    }

    // ჯგუფის მოძიება და წევრობის შემოწმება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ჯგუფი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი
    if (group.members.length === 0) {
      return NextResponse.json(
        { error: "ჯგუფში პოსტის დასამატებლად საჭიროა წევრობა" },
        { status: 403 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { 
      content,
      media,
      isSensitive = false,
      allowComments = true 
    } = requestData;

    // ვალიდაცია
    if (!content && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: "პოსტს უნდა ჰქონდეს ტექსტი ან მედია" },
        { status: 400 }
      );
    }

    // შევამოწმოთ თუ საჭიროა მოდერაცია
    const isPending = group.moderationMode === 'manual';

    // ტრანზაქციის გამოყენება რამდენიმე ოპერაციისთვის
    const post = await prisma.$transaction(async (prisma) => {
      // პოსტის შექმნა
      const newPost = await prisma.groupPost.create({
        data: {
          content,
          authorId: userId,
          groupId,
          isPending,
          isSensitive,
          allowComments
        }
      });

      // მედიის დამატება (თუ არსებობს)
      if (media && Array.isArray(media) && media.length > 0) {
        const mediaPromises = media.map((mediaItem: any) => {
          return prisma.groupMedia.create({
            data: {
              type: mediaItem.type,
              url: mediaItem.url,
              thumbnailUrl: mediaItem.thumbnailUrl,
              width: mediaItem.width,
              height: mediaItem.height,
              caption: mediaItem.caption,
              postId: newPost.id
            }
          });
        });

        await Promise.all(mediaPromises);
      }

      // თუ ეს არის "ქვანტური აზროვნების" ჯგუფი, მოვამზადოთ ანალიზისთვის
      if (group.type === 'quantum' && !isPending) {
        // აქ AI ანალიზს ასინქრონულად გავუშვებდით რეალურ სისტემაში
        // მაგრამ ამჯერად მხოლოდ "ანალიზისთვის მზად" ველს ვაყენებთ
        // ანალიზის რეალური ლოგიკა იქნება სხვა API ენდპოინტში ან სერვისში
      }

      return newPost;
    });

    return NextResponse.json({
      success: true,
      message: isPending 
        ? "პოსტი მოდერაციის ეტაპზეა და გამოქვეყნდება დადასტურების შემდეგ" 
        : "პოსტი წარმატებით დაემატა",
      post,
      isPending
    });
  } catch (error: any) {
    console.error("Error creating group post:", error);
    return NextResponse.json(
      { error: "პოსტის დამატების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}