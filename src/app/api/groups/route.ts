import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";

// ჯგუფების სიის მიღება
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // URL პარამეტრების მიღება
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured") === "true";
    const publicOnly = searchParams.get("publicOnly") === "true";
    const type = searchParams.get("type"); // ჯგუფის ტიპი (standard, quantum, project, info)
    const memberOfOnly = searchParams.get("memberOf") === "true"; // მხოლოდ ჩემი ჯგუფები
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10"), 50); // მაქსიმუმ 50
    const search = searchParams.get("search"); // ძიება სახელით ან აღწერით
    
    // აუთენტიფიკაცია საჭიროა მხოლოდ პირადი ჯგუფებისთვის
    if (!userId && !featured && !publicOnly) {
      return NextResponse.json(
        { error: "ავტორიზაცია საჭიროა" },
        { status: 401 }
      );
    }
    
    // კონვერტაცია უცნობი მომხმარებლისთვის
    const safeUserId = userId || "anonymous-user";

    // ფილტრაციის პირობების შექმნა
    let whereCondition: any = {};
    
    // არაავტორიზებული მომხმარებლებისთვის მხოლოდ ღია ჯგუფები
    if (!userId) {
      whereCondition.isPrivate = false;
    }
    
    // ტიპით ფილტრაცია
    if (type) {
      whereCondition.type = type;
    }
    
    // წევრობით ფილტრაცია - მხოლოდ ავტორიზებული მომხმარებლებისთვის
    if (memberOfOnly && userId) {
      whereCondition.members = {
        some: {
          userId: userId
        }
      };
    }
    
    // ძიებით ფილტრაცია
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // შესაბამის დახარისხება
    let orderBy: any = { updatedAt: "desc" };
    
    // ფიჩერებული ჯგუფებისთვის ჩვენ უნდა გამოვიტანოთ ყველაზე პოპულარული
    if (featured) {
      // Prisma არ უჭერს მხარს მრავალ _count ველზე დალაგებას ერთდროულად,
      // ამიტომ ვიყენებთ მხოლოდ წევრების რაოდენობას და განახლების დროს
      orderBy = {
        members: { _count: "desc" } 
      };
    }

    // ჯგუფების რაოდენობის მიღება პაგინაციისთვის
    const totalGroups = await prisma.group.count({
      where: whereCondition
    });

    // ჯგუფების მიღება
    const groups = await prisma.group.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            username: true,
            displayName: true,
            img: true,
            avatarProps: true
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        },
        // წევრები - მხოლოდ ავტორიზებული მომხმარებლებისთვის რეალური მონაცემები
        members: userId ? {
          where: {
            userId: userId
          },
          select: {
            role: true,
            id: true
          }
        } : undefined,
        categories: {
          select: {
            id: true,
            name: true,
            color: true,
            priority: true
          },
          orderBy: {
            priority: "asc"
          }
        }
      },
      orderBy: orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      groups,
      pagination: {
        total: totalGroups,
        page,
        pageSize,
        totalPages: Math.ceil(totalGroups / pageSize)
      }
    });
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "ჯგუფების მიღების დროს დაფიქსირდა შეცდომა", details: error.message },
      { status: 500 }
    );
  }
}

// ახალი ჯგუფის შექმნა
export async function POST(request: NextRequest) {
  try {
    // მოთხოვნის მონაცემები
    let requestData;
    let userId;
    let userExists = false;

    try {
      // პირდაპირი Supabase კლიენტი
      const supabase = createClient();
      
      // მოვიპოვოთ სესია
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user || !session.user.id) {
        console.error("POST /api/groups: არ არსებობს სესია ან მომხმარებლის ID");
        return NextResponse.json(
          { error: "ავტორიზაცია საჭიროა" },
          { status: 401 }
        );
      }
      
      // მივიღოთ მომხმარებლის ID
      userId = session.user.id;
      
      // შევამოწმოთ რეალურად არსებობს თუ არა მომხმარებელი ბაზაში
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        console.error("POST /api/groups: მომხმარებელი ვერ მოიძებნა ბაზაში. ID:", userId);
        
        // ვცადოთ მომხმარებლის შექმნა Supabase მეტადატიდან
        try {
          const { email, user_metadata } = session.user;
          const username = 
            user_metadata?.username || 
            email?.split('@')[0] || 
            userId.substring(0, 8);
          
          console.log("ვცდილობთ მომხმარებლის შექმნას:", { 
            id: userId, 
            email, 
            username 
          });
          
          // შევქმნათ მომხმარებელი
          const newUser = await prisma.user.create({
            data: {
              id: userId,
              username: username,
              email: email || `${username}@example.com`,
              displayName: user_metadata?.name || username,
              img: user_metadata?.avatar_url || null,
              gender: user_metadata?.gender || 'other'
            }
          });
          
          console.log("მომხმარებელი წარმატებით შეიქმნა:", newUser.id);
          userExists = true;
        } catch (createError) {
          console.error("მომხმარებლის შექმნის შეცდომა:", createError);
          return NextResponse.json(
            { 
              error: "მომხმარებლის პროფილი არ არსებობს და ვერ შეიქმნა",
              details: "გთხოვთ განაახლოთ გვერდი ან შეხვიდეთ სისტემაში ხელახლა"
            },
            { status: 403 }
          );
        }
      } else {
        console.log("POST /api/groups: მომხმარებელი ნაპოვნია ბაზაში. ID:", userId);
        userExists = true;
      }

      // მოთხოვნის შემცველობის პარსინგი JSON-ად
      requestData = await request.json();
    } catch (parseError) {
      console.error("მოთხოვნის პარსინგის შეცდომა:", parseError);
      return NextResponse.json(
        { 
          error: "მოთხოვნის დამუშავების შეცდომა",
          details: parseError instanceof Error ? parseError.message : "გაურკვეველი შეცდომა"
        },
        { status: 400 }
      );
    }
    
    // შევამოწმოთ, რომ მომხმარებელი არსებობს
    if (!userExists || !userId) {
      return NextResponse.json(
        { 
          error: "მომხმარებლის პროფილი ვერ დადასტურდა",
          details: "გთხოვთ განაახლოთ გვერდი ან შეხვიდეთ სისტემაში ხელახლა"
        },
        { status: 403 }
      );
    }
    
    // მონაცემების ამოღება requestData-დან
    const { 
      name, 
      description = "", 
      coverImage = null, 
      type, 
      icon = null, 
      isPrivate = false, 
      moderationMode = "auto",
      categories = [] 
    } = requestData || {};

    // აუცილებელი ველების შემოწმება
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "ჯგუფის სახელი სავალდებულოა" },
        { status: 400 }
      );
    }

    if (!type || !['standard', 'quantum', 'project', 'info'].includes(type)) {
      return NextResponse.json(
        { error: "არასწორი ჯგუფის ტიპი. შესაძლო ვარიანტებია: standard, quantum, project, info" },
        { status: 400 }
      );
    }

    // თუ ქვანტური ჯგუფია, კატეგორიები სავალდებულოა
    if (type === 'quantum') {
      if (!Array.isArray(categories)) {
        return NextResponse.json(
          { error: "კატეგორიები უნდა იყოს მასივი" },
          { status: 400 }
        );
      }
      
      if (categories.length < 2) {
        return NextResponse.json(
          { error: "ქვანტური აზროვნების ჯგუფისთვის საჭიროა მინიმუმ 2 კატეგორია" },
          { status: 400 }
        );
      }
      
      // კატეგორიების ვალიდაცია
      for (const category of categories) {
        if (!category || typeof category !== 'object') {
          return NextResponse.json(
            { error: "კატეგორია უნდა იყოს ობიექტი" },
            { status: 400 }
          );
        }
        
        if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
          return NextResponse.json(
            { error: "ყველა კატეგორიას უნდა ჰქონდეს სახელი" },
            { status: 400 }
          );
        }
        
        if (!category.color || typeof category.color !== 'string') {
          return NextResponse.json(
            { error: "ყველა კატეგორიას უნდა ჰქონდეს ფერი" },
            { status: 400 }
          );
        }
      }
    }

    // აიქონის მნიშვნელობის განსაზღვრა
    const defaultIcon = type === 'standard' ? '👥' : 
                        type === 'quantum' ? '🧠' : 
                        type === 'project' ? '🛠️' : '📰';
    
    const finalIcon = icon || defaultIcon;

    // ტრანზაქციის გამოყენება 
    let createdGroup = null;
    
    try {
      createdGroup = await prisma.$transaction(async (tx) => {
        // 1. ჯგუფის შექმნა
        const newGroup = await tx.group.create({
          data: {
            name: name.trim(),
            description: description || "",
            coverImage: coverImage || null,
            type,
            icon: finalIcon,
            isPrivate: isPrivate === true,
            moderationMode: moderationMode || "auto",
            creatorId: userId
          }
        });
        
        if (!newGroup || !newGroup.id) {
          throw new Error("ჯგუფის შექმნა ვერ მოხერხდა");
        }

        // 2. შემქმნელის დამატება ადმინისტრატორად
        await tx.groupMember.create({
          data: {
            userId,
            groupId: newGroup.id,
            role: "admin"
          }
        });
        
        // 3. კატეგორიების დამატება (თუ არსებობს)
        if (type === 'quantum' && Array.isArray(categories) && categories.length >= 2) {
          try {
            // კატეგორიების მომზადება
            const categoryData = categories.map((category, index) => ({
              name: category.name.trim(),
              description: category.description || '',
              color: category.color,
              priority: index,
              criteria: category.criteria || '',
              groupId: newGroup.id
            }));
            
            // კატეგორიების შექმნა
            for (const catData of categoryData) {
              await tx.opinionCategory.create({
                data: catData
              });
            }
          } catch (categoryError) {
            console.error("კატეგორიების შექმნის შეცდომა:", categoryError);
            throw new Error("კატეგორიების შექმნა ვერ მოხერხდა: " + 
              (categoryError instanceof Error ? categoryError.message : "გაურკვეველი შეცდომა"));
          }
        }
        
        // დავაბრუნოთ შექმნილი ჯგუფი
        return newGroup;
      });
    } catch (txError) {
      console.error("ტრანზაქციის შეცდომა:", txError);
      return NextResponse.json(
        { 
          error: "ჯგუფის შექმნის დროს მოხდა შეცდომა",
          details: txError instanceof Error ? txError.message : "გაურკვეველი შეცდომა ტრანზაქციის დროს"
        },
        { status: 500 }
      );
    }
    
    // შემოწმება, რომ ჯგუფი შეიქმნა
    if (!createdGroup || !createdGroup.id) {
      return NextResponse.json(
        { error: "ჯგუფის შექმნის შემდეგ ვერ დაბრუნდა ჯგუფის მონაცემები" },
        { status: 500 }
      );
    }

    // წარმატებული პასუხი
    return NextResponse.json({
      success: true,
      message: "ჯგუფი წარმატებით შეიქმნა",
      group: createdGroup
    });
  } catch (error: any) {
    console.error("ჯგუფის შექმნის შეცდომა:", error);
    return NextResponse.json(
      { 
        error: "ჯგუფის შექმნის დროს დაფიქსირდა შეცდომა", 
        details: error instanceof Error ? error.message : "გაურკვეველი შეცდომა" 
      },
      { status: 500 }
    );
  }
}