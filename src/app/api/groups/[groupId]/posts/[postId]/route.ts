import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// ჯგუფის პოსტის დეტალების მიღება
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

    // ჯგუფის მოძიება
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
          select: { id: true, role: true }
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
          { error: "პრივატული ჯგუფის პოსტის სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      // შევამოწმოთ, არის თუ არა მომხმარებელი ჯგუფის წევრი
      if (group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის პოსტის ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // მოდერატორების და ადმინების უფლებები
    const isModerator = group.members.some(member => 
      member.role === "admin" || member.role === "moderator"
    );

    // პოსტის მოძიება (მოდერატორებისთვის შეიძლება დაბრუნდეს მოლოდინში მყოფი პოსტები)
    const post = await prisma.groupPost.findUnique({
      where: { 
        id: postId,
        groupId,
        ...(!isModerator ? { isPending: false } : {}) // არამოდერატორებისთვის მხოლოდ დადასტურებული პოსტები
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
        },
        media: true,
        analysis: {
          include: {
            category: true
          }
        },
        comments: {
          where: {
            parentId: null // მხოლოდ პირველი დონის კომენტარები
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 10,
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
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                img: true
              }
            }
          },
          take: 50
        },
        _count: {
          select: {
            comments: true,
            reactions: true
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

    // პოსტის რეაქციების დაჯგუფება ტიპების მიხედვით
    const reactionsCount = post.reactions.reduce((acc: any, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {});

    // მომხმარებლის რეაქციები (ავტორიზებული მომხმარებლისთვის)
    let userReactions = null;
    if (userId) {
      userReactions = post.reactions
        .filter(reaction => reaction.user.id === userId)
        .map(reaction => ({
          id: reaction.id,
          type: reaction.type
        }));
    }

    // მოამზადეთ საბოლოო პასუხი
    const postResponse = {
      ...post,
      reactionsCount,
      userReactions,
      // შემოვიფარგლოთ reacions-ის რაოდენობა
      reactions: post.reactions.slice(0, 10) // პირველი 10 რეაქცია
    };

    return NextResponse.json({
      post: postResponse,
      isModerator,
      group: {
        id: group.id,
        name: group.name,
        type: group.type
      }
    });
  } catch (error: any) {
    console.error("Error fetching group post:", error);
    return NextResponse.json(
      { error: "პოსტის მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფის პოსტის განახლება
export async function PATCH(
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

    // პოსტის მოძიება
    const post = await prisma.groupPost.findUnique({
      where: { 
        id: postId,
        groupId
      },
      include: {
        group: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ["admin", "moderator"] }
              }
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

    // უფლებების შემოწმება (ავტორს ან მოდერატორს/ადმინს შეუძლია პოსტის რედაქტირება)
    const isAuthor = post.authorId === userId;
    const isModerator = post.group.members.length > 0;
    
    if (!isAuthor && !isModerator) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ პოსტის რედაქტირების უფლება" },
        { status: 403 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { 
      content,
      isSensitive,
      allowComments,
      isPending,
      isModerated
    } = requestData;

    // განახლებისთვის მონაცემების მომზადება
    const updateData: any = {};
    
    // ავტორს შეუძლია შეცვალოს კონტენტი და მგრძნობიარობის ფლაგი
    if (isAuthor) {
      if (content !== undefined) updateData.content = content;
      if (isSensitive !== undefined) updateData.isSensitive = isSensitive;
    }
    
    // მოდერატორებს შეუძლიათ შეცვალონ დამატებითი პარამეტრები
    if (isModerator) {
      if (allowComments !== undefined) updateData.allowComments = allowComments;
      if (isPending !== undefined) updateData.isPending = isPending;
      if (isModerated !== undefined) updateData.isModerated = isModerated;
    }

    // თუ არაფერი არ იცვლება
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "განახლებისთვის საჭიროა მინიმუმ ერთი პარამეტრი" },
        { status: 400 }
      );
    }

    // პოსტის განახლება
    const updatedPost = await prisma.groupPost.update({
      where: { id: postId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "პოსტი წარმატებით განახლდა",
      post: updatedPost
    });
  } catch (error: any) {
    console.error("Error updating group post:", error);
    return NextResponse.json(
      { error: "პოსტის განახლების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ჯგუფის პოსტის წაშლა
export async function DELETE(
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

    // პოსტის მოძიება
    const post = await prisma.groupPost.findUnique({
      where: { 
        id: postId,
        groupId
      },
      include: {
        group: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ["admin", "moderator"] }
              }
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

    // უფლებების შემოწმება (ავტორს ან მოდერატორს/ადმინს შეუძლია პოსტის წაშლა)
    const isAuthor = post.authorId === userId;
    const isModerator = post.group.members.length > 0;
    
    if (!isAuthor && !isModerator) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ პოსტის წაშლის უფლება" },
        { status: 403 }
      );
    }

    // პოსტის წაშლა (კასკადური წაშლა - კომენტარები, რეაქციები და ა.შ.)
    await prisma.groupPost.delete({
      where: { id: postId }
    });

    return NextResponse.json({
      success: true,
      message: "პოსტი წარმატებით წაიშალა"
    });
  } catch (error: any) {
    console.error("Error deleting group post:", error);
    return NextResponse.json(
      { error: "პოსტის წაშლის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}