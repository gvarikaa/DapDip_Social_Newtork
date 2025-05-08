import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// ჯგუფის პოსტის კომენტარების სიის მიღება
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string; postId: string } }
) {
  try {
    const { groupId, postId } = params;
    
    if (!groupId || !postId) {
      return NextResponse.json(
        { error: "ჯგუფის და პოსტის იდენტიფიკატორები აუცილებელია" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // პოსტის მოძიება და ვალიდაცია
    const post = await prisma.groupPost.findUnique({
      where: { 
        id: postId,
        groupId
      },
      include: {
        group: {
          select: {
            isPrivate: true,
            members: userId ? {
              where: { userId },
              select: { id: true }
            } : undefined
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "პოსტი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // შევამოწმოთ, შეიძლება თუ არა კომენტარები
    if (!post.allowComments) {
      return NextResponse.json(
        { error: "ამ პოსტზე კომენტარები გამორთულია" },
        { status: 400 }
      );
    }

    // პრივატული ჯგუფის შემთხვევაში ვამოწმებთ წევრობას
    if (post.group.isPrivate) {
      // შევამოწმოთ, არის თუ არა მომხმარებელი ავტორიზებული
      if (!userId) {
        return NextResponse.json(
          { error: "პრივატული ჯგუფის კომენტარების სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი
      if (!post.group.members?.length) {
        return NextResponse.json(
          { error: "ამ ჯგუფის კომენტარების ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // URL პარამეტრების მიღება
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50); // მაქსიმუმ 50
    const parentId = searchParams.get("parentId"); // თუ გვაინტერესებს კონკრეტული კომენტარის პასუხები
    const sort = searchParams.get("sort") || "newest"; // 'newest', 'oldest', 'popular'

    // ფილტრაციის პირობების შექმნა
    const whereCondition: any = {
      postId,
      parentId: parentId || null // თუ parentId არის null, მაშინ პირველი დონის კომენტარებს ვიღებთ
    };

    // სორტირების კრიტერიუმის მიხედვით orderBy-ის მომზადება
    let orderBy: any = {};
    switch (sort) {
      case "popular":
        // პოპულარული კომენტარები - რეაქციების რაოდენობის მიხედვით
        orderBy = {
          reactions: {
            _count: "desc"
          }
        };
        break;
      case "oldest":
        // ძველი კომენტარები
        orderBy = {
          createdAt: "asc"
        };
        break;
      case "newest":
      default:
        // ახალი კომენტარები (ნაგულისხმევი)
        orderBy = {
          createdAt: "desc"
        };
        break;
    }

    // კომენტარების რაოდენობის მიღება პაგინაციისთვის
    const totalComments = await prisma.groupComment.count({
      where: whereCondition
    });

    // კომენტარების მიღება
    const comments = await prisma.groupComment.findMany({
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
        _count: {
          select: {
            replies: true,
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
      comments,
      pagination: {
        total: totalComments,
        page,
        pageSize,
        totalPages: Math.ceil(totalComments / pageSize)
      }
    });
  } catch (error: any) {
    console.error("Error fetching post comments:", error);
    return NextResponse.json(
      { error: "კომენტარების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფის პოსტზე კომენტარის დამატება
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; postId: string } }
) {
  try {
    const { groupId, postId } = params;
    
    if (!groupId || !postId) {
      return NextResponse.json(
        { error: "ჯგუფის და პოსტის იდენტიფიკატორები აუცილებელია" },
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

    // პოსტის მოძიება და ვალიდაცია
    const post = await prisma.groupPost.findUnique({
      where: { 
        id: postId,
        groupId,
        isPending: false // კომენტარის დამატება შეიძლება მხოლოდ დადასტურებულ პოსტებზე
      },
      include: {
        group: {
          select: {
            id: true,
            isPrivate: true,
            type: true,
            members: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "პოსტი ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // შევამოწმოთ, შეიძლება თუ არა კომენტარები
    if (!post.allowComments) {
      return NextResponse.json(
        { error: "ამ პოსტზე კომენტარები გამორთულია" },
        { status: 400 }
      );
    }

    // პრივატული ჯგუფის შემთხვევაში ვამოწმებთ წევრობას
    if (post.group.isPrivate && !post.group.members.length) {
      return NextResponse.json(
        { error: "ჯგუფის წევრობა საჭიროა კომენტარის დასამატებლად" },
        { status: 403 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { 
      content,
      audioUrl,
      parentId 
    } = requestData;

    // ვალიდაცია
    if (!content && !audioUrl) {
      return NextResponse.json(
        { error: "კომენტარს უნდა ჰქონდეს ტექსტი ან აუდიო" },
        { status: 400 }
      );
    }

    // თუ მშობელი კომენტარის ID-ია მითითებული, ვამოწმებთ მას
    if (parentId) {
      const parentComment = await prisma.groupComment.findUnique({
        where: { 
          id: parentId,
          postId
        }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "მშობელი კომენტარი ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      // თუ მშობელ კომენტარს უკვე აქვს parent, ვერ დავამატებთ (ერიდება ღრმა ჩაბუდების იერარქიას)
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: "მხოლოდ ერთი დონის ჩაბუდება არის დაშვებული" },
          { status: 400 }
        );
      }
    }

    // კომენტარის შექმნა
    const comment = await prisma.groupComment.create({
      data: {
        content,
        audioUrl,
        authorId: userId,
        postId,
        parentId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        }
      }
    });

    // თუ ეს არის "ქვანტური აზროვნების" ჯგუფი, მოვამზადოთ ანალიზისთვის
    if (post.group.type === 'quantum') {
      // აქ AI ანალიზს ასინქრონულად გავუშვებდით რეალურ სისტემაში
      // ანალიზის რეალური ლოგიკა იქნება სხვა API ენდპოინტში ან სერვისში
    }

    return NextResponse.json({
      success: true,
      message: "კომენტარი წარმატებით დაემატა",
      comment
    });
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "კომენტარის დამატების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}