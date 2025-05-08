import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/supabase/server';
import { prisma } from '@/prisma';
import { projectManagementAssistant } from '@/utils/gemini';

/**
 * API მარშრუტი პროექტის მენეჯმენტის AI ასისტენტისთვის
 * ეს ასისტენტი ჯგუფებს ეხმარება პროექტების დაგეგმვაში, პრიორიტეტიზაციაში,
 * ანალიზში და ანგარიშგებაში AI-ის დახმარებით.
 */
export async function POST(request: NextRequest) {
  try {
    // მომხმარებლის ავთენტიფიკაცია
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'მომხმარებელი არ არის ავტორიზებული' },
        { status: 401 }
      );
    }

    // მოთხოვნის პარამეტრების პარსინგი
    const body = await request.json();
    const { projectId, query, assistantType = 'planner' } = body;

    // პროექტის ID-ის ვალიდაცია
    if (!projectId) {
      return NextResponse.json(
        { error: 'პროექტის ID აუცილებელია' },
        { status: 400 }
      );
    }

    // მომხმარებლის წვდომის შემოწმება პროექტზე
    const userAccess = await prisma.groupProjectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    // ჯგუფის ადმინისტრატორის წვდომის შემოწმება
    const isGroupAdmin = await prisma.groupMember.findFirst({
      where: {
        userId,
        role: 'ADMIN',
        group: {
          projects: {
            some: {
              id: projectId,
            },
          },
        },
      },
    });

    if (!userAccess && !isGroupAdmin) {
      return NextResponse.json(
        { error: 'არ გაქვთ წვდომა ამ პროექტზე' },
        { status: 403 }
      );
    }

    // პროექტის მონაცემების მიღება
    const project = await prisma.groupProject.findUnique({
      where: {
        id: projectId,
      },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            comments: true,
          },
        },
        milestones: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        resources: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'პროექტი ვერ მოიძებნა' },
        { status: 404 }
      );
    }

    // AI ასისტენტის გამოძახება
    const assistantResponse = await projectManagementAssistant(
      project,
      query,
      assistantType as 'planner' | 'prioritizer' | 'analyzer' | 'reporter'
    );

    // სასარგებლო შედეგების დაბრუნება
    return NextResponse.json({
      projectId,
      assistantType,
      response: assistantResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Project Management Assistant error:', error);
    return NextResponse.json(
      { error: 'მოხდა შეცდომა მოთხოვნის დამუშავებისას' },
      { status: 500 }
    );
  }
}

/**
 * მარშრუტი ხელმისაწვდომი ასისტენტის ტიპების მისაღებად
 */
export async function GET(request: NextRequest) {
  try {
    // მომხმარებლის ავთენტიფიკაცია
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'მომხმარებელი არ არის ავტორიზებული' },
        { status: 401 }
      );
    }

    // ასისტენტის ტიპები და მათი აღწერები
    const assistantTypes = [
      {
        id: 'planner',
        name: 'პროექტის დაგეგმვის ასისტენტი',
        description: 'დაგეხმარებათ პროექტის ეფექტურად დაგეგმვაში, ამოცანების სტრუქტურირებაში და რისკების იდენტიფიკაციაში',
        icon: 'calendar',
        examples: [
          'როგორ გავაუმჯობესო პროექტის ვადები?',
          'რა რისკები არსებობს ამ პროექტში?',
          'მჭირდება დახმარება პროექტის გეგმის შემუშავებაში',
        ],
      },
      {
        id: 'prioritizer',
        name: 'პრიორიტეტიზაციის ასისტენტი',
        description: 'დაგეხმარებათ ამოცანების პრიორიტეტიზაციაში და რესურსების ოპტიმალურ განაწილებაში',
        icon: 'list-ordered',
        examples: [
          'რომელი ამოცანები უნდა იყოს პრიორიტეტული?',
          'როგორ განვანაწილო რესურსები ეფექტურად?',
          'რომელი ამოცანებია კრიტიკული გზის ნაწილი?',
        ],
      },
      {
        id: 'analyzer',
        name: 'პროექტის ანალიტიკოსი',
        description: 'პროექტის პროგრესის ანალიზი, ტენდენციების იდენტიფიკაცია და შესრულების შეფასება',
        icon: 'line-chart',
        examples: [
          'რა ტენდენციები იკვეთება პროექტში?',
          'ვართ თუ არა გრაფიკში?',
          'რა პრობლემები იქმნება პროექტის შესრულებისას?',
        ],
      },
      {
        id: 'reporter',
        name: 'ანგარიშგების ასისტენტი',
        description: 'დაგეხმარებათ პროექტის ანგარიშების, პრეზენტაციების და დოკუმენტაციის შექმნაში',
        icon: 'file-text',
        examples: [
          'მომამზადე პროექტის სტატუსის ანგარიში',
          'შეაჯამე პროექტის პროგრესი',
          'მჭირდება პრეზენტაცია დაინტერესებული მხარეებისთვის',
        ],
      },
    ];

    return NextResponse.json({ assistantTypes });
  } catch (error) {
    console.error('Error fetching assistant types:', error);
    return NextResponse.json(
      { error: 'მოხდა შეცდომა მონაცემების მიღებისას' },
      { status: 500 }
    );
  }
}