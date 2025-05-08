import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Submit a vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; pollId: string } }
) {
  try {
    const { groupId, pollId } = params;
    
    if (!groupId || !pollId) {
      return NextResponse.json(
        { error: "ჯგუფის და გამოკითხვის იდენტიფიკატორები აუცილებელია" },
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

    // Find group and check membership
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

    // Check if user is a member
    if (group.members.length === 0) {
      return NextResponse.json(
        { error: "ჯგუფში ხმის მისაცემად საჭიროა წევრობა" },
        { status: 403 }
      );
    }

    // Find poll
    const poll = await prisma.groupPoll.findUnique({
      where: { 
        id: pollId,
        groupId
      }
    });

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check if poll has expired
    if (poll.endDate && new Date(poll.endDate) < new Date()) {
      return NextResponse.json(
        { error: "გამოკითხვა დასრულებულია და ხმის მიცემა აღარ შეიძლება" },
        { status: 400 }
      );
    }

    // Get request data
    const requestData = await request.json();
    const { optionIds } = requestData;

    // Validate input
    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { error: "გთხოვთ აირჩიოთ მინიმუმ ერთი ვარიანტი" },
        { status: 400 }
      );
    }

    // For single-choice polls, ensure only one option
    if (!poll.isMultiple && optionIds.length > 1) {
      return NextResponse.json(
        { error: "ამ გამოკითხვაში მხოლოდ ერთი ვარიანტის არჩევა შეიძლება" },
        { status: 400 }
      );
    }

    // Check if options exist in poll
    const pollOptions = JSON.parse(JSON.stringify(poll.options));
    const validOptionIds = pollOptions.map((option: any) => option.id);
    
    const invalidOptions = optionIds.filter(
      (optionId: string) => !validOptionIds.includes(optionId)
    );
    
    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: "არჩეული ვარიანტები არ არსებობს ამ გამოკითხვაში" },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVotes = await prisma.pollVote.findFirst({
      where: {
        userId,
        pollId
      }
    });

    if (existingVotes) {
      return NextResponse.json(
        { error: "თქვენ უკვე მიეცით ხმა ამ გამოკითხვას" },
        { status: 400 }
      );
    }

    // Create votes
    const votePromises = optionIds.map((optionId: string) => 
      prisma.pollVote.create({
        data: {
          optionId,
          userId,
          pollId
        }
      })
    );

    await prisma.$transaction(votePromises);

    return NextResponse.json({
      success: true,
      message: "ხმა წარმატებით დაფიქსირდა",
      votes: optionIds
    });
  } catch (error: any) {
    console.error("Error voting on poll:", error);
    return NextResponse.json(
      { error: "ხმის მიცემის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Remove a vote (if allowed)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; pollId: string } }
) {
  try {
    const { groupId, pollId } = params;
    
    if (!groupId || !pollId) {
      return NextResponse.json(
        { error: "ჯგუფის და გამოკითხვის იდენტიფიკატორები აუცილებელია" },
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

    // Find poll
    const poll = await prisma.groupPoll.findUnique({
      where: { 
        id: pollId,
        groupId
      }
    });

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check if poll has expired
    if (poll.endDate && new Date(poll.endDate) < new Date()) {
      return NextResponse.json(
        { error: "გამოკითხვა დასრულებულია და ხმის გაუქმება აღარ შეიძლება" },
        { status: 400 }
      );
    }

    // Delete user's votes
    const result = await prisma.pollVote.deleteMany({
      where: {
        userId,
        pollId
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "თქვენი ხმა ვერ მოიძებნა ამ გამოკითხვაში" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ხმა წარმატებით გაუქმდა",
      removedVotes: result.count
    });
  } catch (error: any) {
    console.error("Error removing vote from poll:", error);
    return NextResponse.json(
      { error: "ხმის გაუქმების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}