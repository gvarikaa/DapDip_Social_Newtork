import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// Get poll details
export async function GET(
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

    // Find group
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

    // For private groups, check membership
    if (group.isPrivate) {
      if (!userId) {
        return NextResponse.json(
          { error: "პრივატული ჯგუფის გამოკითხვის სანახავად საჭიროა ავტორიზაცია" },
          { status: 401 }
        );
      }

      if (group.members.length === 0) {
        return NextResponse.json(
          { error: "ამ ჯგუფის გამოკითხვის ნახვისთვის საჭიროა წევრობა", isPrivate: true },
          { status: 403 }
        );
      }
    }

    // Check moderator/admin rights
    const isModerator = group.members.some(member => 
      member.role === "admin" || member.role === "moderator"
    );

    // Find poll
    const poll = await prisma.groupPoll.findUnique({
      where: { 
        id: pollId,
        groupId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                img: true
              }
            }
          }
        },
        analyses: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // For anonymous polls, hide user details if not moderator
    let processedVotes = poll.votes;
    if (poll.isAnonymous && !isModerator) {
      processedVotes = poll.votes.map(vote => ({
        ...vote,
        user: null
      }));
    }

    // Organize vote data
    const options = JSON.parse(JSON.stringify(poll.options));
    const voteCounts = options.map((option: any) => {
      const votes = processedVotes.filter(vote => vote.optionId === option.id);
      return {
        ...option,
        count: votes.length,
        percentage: processedVotes.length > 0 
          ? Math.round((votes.length / processedVotes.length) * 100) 
          : 0
      };
    });

    // Find user's votes
    const userVotes = userId 
      ? poll.votes.filter(vote => vote.userId === userId)
      : [];

    // Final response
    const isExpired = poll.endDate ? new Date(poll.endDate) < new Date() : false;
    const canVote = !isExpired && userId && userVotes.length === 0;

    return NextResponse.json({
      poll: {
        ...poll,
        options: voteCounts,
        userVotes,
        isExpired,
        canVote,
        totalVotes: poll.votes.length
      },
      isModerator,
      group: {
        id: group.id,
        name: group.name,
        type: group.type
      }
    });
  } catch (error: any) {
    console.error("Error fetching group poll:", error);
    return NextResponse.json(
      { error: "გამოკითხვის მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Update poll details (moderators/admins or creator only)
export async function PATCH(
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

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions (creator or moderator/admin)
    const isCreator = poll.createdById === userId;
    const isModerator = poll.group.members.length > 0;
    
    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ გამოკითხვის რედაქტირების უფლება" },
        { status: 403 }
      );
    }

    // Get request data
    const requestData = await request.json();
    const { 
      question,
      options,
      isMultiple,
      isAnonymous,
      endDate
    } = requestData;

    // Prepare update data
    const updateData: any = {};
    
    if (isCreator || isModerator) {
      if (question !== undefined) updateData.question = question;
      if (isMultiple !== undefined) updateData.isMultiple = isMultiple;
      if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      
      // Only allow option updates if no votes yet (data integrity)
      if (options !== undefined) {
        const voteCount = await prisma.pollVote.count({
          where: { pollId }
        });
        
        if (voteCount === 0) {
          // Format options
          const formattedOptions = options.map((option: string, index: number) => ({
            id: `option_${index + 1}`,
            text: option
          }));
          
          updateData.options = formattedOptions;
        } else {
          return NextResponse.json(
            { error: "ვარიანტების რედაქტირება შეუძლებელია, რადგან უკვე არსებობს ხმები" },
            { status: 400 }
          );
        }
      }
    }

    // If nothing is changing
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "განახლებისთვის საჭიროა მინიმუმ ერთი პარამეტრი" },
        { status: 400 }
      );
    }

    // Update poll
    const updatedPoll = await prisma.groupPoll.update({
      where: { id: pollId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "გამოკითხვა წარმატებით განახლდა",
      poll: updatedPoll
    });
  } catch (error: any) {
    console.error("Error updating group poll:", error);
    return NextResponse.json(
      { error: "გამოკითხვის განახლების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// Delete poll (moderators/admins or creator only)
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

    if (!poll) {
      return NextResponse.json(
        { error: "გამოკითხვა ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    // Check permissions (creator or moderator/admin)
    const isCreator = poll.createdById === userId;
    const isModerator = poll.group.members.length > 0;
    
    if (!isCreator && !isModerator) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ გამოკითხვის წაშლის უფლება" },
        { status: 403 }
      );
    }

    // Delete poll (cascade will handle votes and analyses)
    await prisma.groupPoll.delete({
      where: { id: pollId }
    });

    return NextResponse.json({
      success: true,
      message: "გამოკითხვა წარმატებით წაიშალა"
    });
  } catch (error: any) {
    console.error("Error deleting group poll:", error);
    return NextResponse.json(
      { error: "გამოკითხვის წაშლის დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}