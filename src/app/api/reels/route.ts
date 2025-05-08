// src/app/api/reels/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/supabase/auth";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");
  const personalized = searchParams.get("personalized") === "true";

  try {
    // რილსების მოძიებისთვის პირობები
    let whereCondition: any = { isPublished: true };
    
    if (category) {
      whereCondition.category = { name: category };
    }

    // ძირითადი მოძიება
    let reels;
    
    // თუ პერსონალიზებულია
    if (personalized) {
      // მოვიძიოთ მომხმარებლის ინტერესები
      const userInterests = await prisma.userInterest.findMany({
        where: { userId },
        include: { topic: true },
        orderBy: { score: 'desc' }
      });
      
      const topicIds = userInterests.map(interest => interest.topicId);
      
      if (topicIds.length > 0) {
        // თუ აქვს ინტერესები, მოვიძიოთ შესაბამისი რილსები
        reels = await prisma.reel.findMany({
          where: {
            ...whereCondition,
            topics: {
              some: {
                id: { in: topicIds }
              }
            }
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
            topics: true,
            hashtags: { include: { hashtag: true } },
            _count: {
              select: {
                likes: true,
                comments: true,
                saves: true
              }
            },
            likes: userId ? { where: { userId }, select: { id: true } } : undefined,
            saves: userId ? { where: { userId }, select: { id: true } } : undefined
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        });
      }
    }
    
    // თუ პერსონალიზებული არ არის ან არ აქვს ინტერესები
    if (!personalized || !reels || reels.length < limit) {
      // სტანდარტული მოძიება
      reels = await prisma.reel.findMany({
        where: whereCondition,
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
          topics: true,
          hashtags: { include: { hashtag: true } },
          _count: {
            select: {
              likes: true,
              comments: true,
              saves: true
            }
          },
          likes: userId ? { where: { userId }, select: { id: true } } : undefined,
          saves: userId ? { where: { userId }, select: { id: true } } : undefined
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });
    }

    // სულ რილსების რაოდენობა
    const totalReels = await prisma.reel.count({ where: whereCondition });
    const hasMore = page * limit < totalReels;

    return Response.json({ reels, hasMore, total: totalReels });
  } catch (error) {
    console.error("რილსების ძიებისას შეცდომა:", error);
    return Response.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}

// დამატების ფუნქცია
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    // ვიდეოს ფაილი
    const videoFile = formData.get("video") as File;
    if (!videoFile) {
      return NextResponse.json({ error: "ვიდეო ფაილი აუცილებელია" }, { status: 400 });
    }
    
    // მეტა-მონაცემები
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string;
    const hashtagsStr = formData.get("hashtags") as string;
    const isSensitive = formData.get("isSensitive") === "true";
    
    // ატვირთვა Bunny.net-ზე
    try {
      // ვიდეოს ატვირთვა
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
      const videoUrl = await uploadToBunny(
        videoBuffer, 
        `${Date.now()}_${videoFile.name.replace(/\s+/g, '_')}`,
        'reels'
      );
      
      // თამბნეილის ატვირთვა (თუ არსებობს)
      let thumbnailUrl = "";
      const thumbnailFile = formData.get("thumbnail") as File | null;
      
      if (thumbnailFile) {
        const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
        thumbnailUrl = await uploadToBunny(
          thumbnailBuffer,
          `thumb_${Date.now()}_${thumbnailFile.name.replace(/\s+/g, '_')}`,
          'reels'
        );
      }
      
      // ჰეშთეგების პარსვა
      const hashtags = hashtagsStr ? JSON.parse(hashtagsStr) as string[] : [];
      
      // რილსის შექმნა ბაზაში
      const reel = await prisma.reel.create({
        data: {
          title,
          desc: description,
          videoUrl, 
          thumbnailUrl,
          duration: 0, // მოგვიანებით განახლდება
          width: 1080, // ნაგულისხმევი მნიშვნელობა
          height: 1920, // ნაგულისხმევი მნიშვნელობა
          isSensitive,
          userId,
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          hashtags: {
            create: hashtags.map(hashtagName => ({
              hashtag: {
                connectOrCreate: {
                  where: { name: hashtagName },
                  create: { name: hashtagName }
                }
              }
            }))
          },
          analytics: {
            create: {}
          }
        }
      });
      
      // განვაახლოთ გვერდი
      revalidatePath('/reels');
      
      return NextResponse.json({ success: true, reel });
      
    } catch (error) {
      console.error("ატვირთვის შეცდომა:", error);
      return NextResponse.json({ error: "ფაილის ატვირთვა ვერ მოხერხდა" }, { status: 500 });
    }
    
  } catch (error) {
    console.error("რილსის დამატებისას შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}

// Bunny.net-ზე ფაილის ატვირთვის ფუნქცია
async function uploadToBunny(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const accessKey = process.env.BUNNY_API_KEY;
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const cdnUrl = process.env.BUNNY_CDN_URL;
  
  if (!accessKey || !storageZone || !cdnUrl) {
    throw new Error("Bunny.net კონფიგურაცია არ არის განსაზღვრული");
  }
  
  // ფაილის სახელი უნდა იყოს URL-სეიფ
  const safeFilename = encodeURIComponent(filename);
  
  // URL for upload
  const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${folder}/${safeFilename}`;
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'AccessKey': accessKey,
      },
      body: buffer
    });
    
    if (!response.ok) {
      throw new Error(`Bunny.net ატვირთვის შეცდომა: ${response.status} ${response.statusText}`);
    }
    
    // დაბრუნება CDN URL-ის
    return `${cdnUrl}/${folder}/${safeFilename}`;
    
  } catch (error) {
    console.error("Bunny.net ატვირთვის შეცდომა:", error);
    throw error;
  }
}