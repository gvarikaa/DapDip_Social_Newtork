import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// პოსტზე რეაქციის დამატება ან გაუქმება
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
        isPending: false // რეაქცია შეიძლება მხოლოდ დადასტურებულ პოსტებზე
      },
      include: {
        group: {
          select: {
            isPrivate: true,
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

    // პრივატული ჯგუფის შემთხვევაში ვამოწმებთ წევრობას
    if (post.group.isPrivate && !post.group.members.length) {
      return NextResponse.json(
        { error: "ჯგუფის წევრობა საჭიროა რეაქციის დასამატებლად" },
        { status: 403 }
      );
    }

    // მონაცემების მიღება
    const requestData = await request.json();
    const { type, action = "add" } = requestData;

    // ვალიდაცია
    if (!type) {
      return NextResponse.json(
        { error: "რეაქციის ტიპი სავალდებულოა" },
        { status: 400 }
      );
    }

    // დაშვებული რეაქციის ტიპები - შეიძლება კონფიგურაციაში იყოს
    const allowedReactionTypes = [
      'like', 'support', 'disagree', 'insightful', 'funny', 'sad'
    ];
    
    if (!allowedReactionTypes.includes(type)) {
      return NextResponse.json(
        { error: "არასწორი რეაქციის ტიპი", allowedTypes: allowedReactionTypes },
        { status: 400 }
      );
    }

    // არსებული რეაქციის შემოწმება
    const existingReaction = await prisma.groupReaction.findFirst({
      where: {
        userId,
        postId,
        type
      }
    });

    let result;

    // რეაქციის დამატება ან წაშლა
    if (action === "add") {
      // თუ რეაქცია უკვე არსებობს, შეცდომა
      if (existingReaction) {
        return NextResponse.json(
          { error: "ეს რეაქცია უკვე დამატებულია", reactionId: existingReaction.id },
          { status: 400 }
        );
      }

      // ახალი რეაქციის შექმნა
      result = await prisma.groupReaction.create({
        data: {
          type,
          userId,
          postId
        }
      });

      return NextResponse.json({
        success: true,
        message: "რეაქცია წარმატებით დაემატა",
        reaction: result
      });
    } else if (action === "remove") {
      // თუ რეაქცია არ არსებობს, შეცდომა
      if (!existingReaction) {
        return NextResponse.json(
          { error: "რეაქცია ვერ მოიძებნა" },
          { status: 404 }
        );
      }

      // რეაქციის წაშლა
      await prisma.groupReaction.delete({
        where: { id: existingReaction.id }
      });

      return NextResponse.json({
        success: true,
        message: "რეაქცია წარმატებით წაიშალა",
      });
    } else {
      return NextResponse.json(
        { error: "არასწორი მოქმედება. დაშვებულია მხოლოდ 'add' ან 'remove'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error with post reaction:", error);
    return NextResponse.json(
      { error: "რეაქციის დამუშავების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}