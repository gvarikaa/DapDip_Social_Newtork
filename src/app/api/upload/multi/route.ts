import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/prisma";
import { uploadFileToBunny } from "@/utils/bunnyUtils";
import { extractHashtags, saveHashtags } from "@/utils/hashtagUtils";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

async function uploadToBunny(file: File, imgType: string) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ტრანსფორმაციის ლოგიკა გავასწოროთ
    const fileId = uuidv4();
    const fileName = `${fileId}_${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;

    console.log("ატვირთვის პარამეტრები:", {
      fileName,
      folder: "/posts",
      fileType: file.type,
    });

    // ატვირთვა Bunny.net-ზე სერვერის მხარეს
    const result = await uploadFileToBunny(buffer, fileName, "posts", true);

    if (!result.success) {
      throw new Error(`ფაილის ატვირთვა ვერ მოხერხდა: ${result.statusCode}`);
    }

    return {
      url: result.url,
      fileType: file.type.includes("image") ? "image" : "video",
      filePath: result.url,
      height: imgType === "square" ? 600 : null,
      width: imgType === "wide" ? 800 : 600,
    };
  } catch (error: unknown) {
    console.error("ფაილის დამუშავების შეცდომა:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // ავტორიზაციის შემოწმება Supabase-ით
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "ავტორიზაცია აუცილებელია" },
        { status: 401 }
      );
    }
    
    // formData-ს წაკითხვა
    let formData;
    try {
      formData = await request.formData();
      console.log("FormData მიღებულია");
    } catch (error: unknown) {
      console.error("FormData წაკითხვის შეცდომა:", error);
      return NextResponse.json(
        { error: "მონაცემების წაკითხვა ვერ მოხერხდა" },
        { status: 400 }
      );
    }
    
    // ძირითადი ინფორმაცია
    const desc = formData.get("desc") as string || "";
    const imgType = formData.get("imgType") as string || "original";
    const isSensitiveStr = formData.get("isSensitive") as string;
    const isSensitive = isSensitiveStr === "true";
    
    console.log("მიღებული პარამეტრები:", {
      desc: desc.length > 20 ? `${desc.substring(0, 20)}...` : desc,
      imgType,
      isSensitive
    });
    
    // მივიღოთ ფაილი ფორმიდან
    const file = formData.get("file") as File | null;
    
    if (!file || file.size === 0) {
      console.error("ფაილი არ მოიძებნა formData-ში");
      return NextResponse.json(
        { error: "ფაილი არ მოიძებნა" },
        { status: 400 }
      );
    }
    
    console.log("ფაილის ინფორმაცია:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    let postId = Number(formData.get("postId")) || null; // თუ ეს არის მთავარი პოსტის მიბმული ფაილი
    let parentPostId = Number(formData.get("parentPostId")) || null; // თუ ეს არის მიბმული პოსტი
    
    try {
      // ატვირთვა Bunny.net-ზე
      console.log("ვიწყებ ატვირთვას Bunny.net-ზე");
      const uploadResult = await uploadToBunny(file, imgType);
      console.log("Bunny.net ატვირთვის შედეგი:", uploadResult);
      
      // მომზადება Prisma-სთვის
      let img = "";
      let imgHeight = 0;
      let video = "";
      
      if (uploadResult.fileType === "image") {
        img = uploadResult.url;
        imgHeight = uploadResult.height || 0;
      } else {
        video = uploadResult.url;
      }
      
      // პოსტის შექმნა
      const postData: any = {
        desc,
        userId,
        isSensitive,
        img,
        imgHeight,
        video,
      };
      
      // თუ ეს დამატებითი ფაილია უკვე არსებული პოსტისთვის
      if (parentPostId) {
        postData.parentPostId = parentPostId;
      }
      
      console.log("ვქმნი პოსტს მონაცემთა ბაზაში:", postData);
      
      // პოსტის შექმნა
      const post = await prisma.post.create({
        data: postData,
      });
      
      console.log("პოსტი შეიქმნა:", post);
      
      // ჰეშთეგების დამუშავება
      if (desc) {
        const hashtags = extractHashtags(desc);
        if (hashtags.length > 0) {
          await saveHashtags(post.id, hashtags);
          console.log("ჰეშთეგები შენახულია:", hashtags);
        }
      }
      
      // განვაახლოთ UI
      revalidatePath(`/`);
      
      // შევქმნათ მედიის ობიექტი რომელიც დაბრუნდება
      const mediaItem = {
        id: post.id,
        type: img ? 'image' : 'video',
        url: img || video,
        height: imgHeight,
        isSensitive,
        postId: post.id,
        parentPostId: parentPostId
      };
      
      return NextResponse.json({
        success: true,
        post,
        media: mediaItem
      });
      
    } catch (error: unknown) {
      console.error("ფაილის ატვირთვის შეცდომა:", error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return NextResponse.json(
        { 
          error: "ფაილის ატვირთვა ვერ მოხერხდა", 
          details: errorMessage
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("მოთხოვნის დამუშავების შეცდომა:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { 
        error: "სერვერის შეცდომა", 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// ამ ენდფოინტით შეგიძლიათ მიიღოთ პოსტის მედიის ინფორმაცია
export async function GET(request: NextRequest) {
  // ავტორიზაციის შემოწმება Supabase-ით
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: "ავტორიზაცია აუცილებელია" },
      { status: 401 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  
  if (!postId) {
    return NextResponse.json(
      { error: "პოსტის ID აუცილებელია" },
      { status: 400 }
    );
  }
  
  try {
    // მოვძებნოთ პოსტები იმავე მშობელი პოსტით
    const postIdNum = Number(postId);
    
    // მთავარი პოსტი
    const mainPost = await prisma.post.findUnique({
      where: { id: postIdNum },
      select: {
        id: true,
        img: true,
        video: true,
        imgHeight: true,
        isSensitive: true
      }
    });
    
    if (!mainPost) {
      return NextResponse.json(
        { error: "პოსტი ვერ მოიძებნა" },
        { status: 404 }
      );
    }
    
    // მიბმული პოსტები (დამატებითი მედია)
    const childPosts = await prisma.post.findMany({
      where: { parentPostId: postIdNum },
      select: {
        id: true,
        img: true,
        video: true,
        imgHeight: true,
        isSensitive: true
      }
    });
    
    // მთლიანი მედიის სია
    const allMedia = [];
    
    // მთავარი პოსტის მედია
    if (mainPost.img || mainPost.video) {
      allMedia.push({
        id: mainPost.id,
        type: mainPost.img ? 'image' : 'video',
        url: mainPost.img || mainPost.video,
        height: mainPost.imgHeight,
        isSensitive: mainPost.isSensitive
      });
    }
    
    // დავამატოთ ყველა მიბმული პოსტის მედიაც
    childPosts.forEach(post => {
      if (post.img || post.video) {
        allMedia.push({
          id: post.id,
          type: post.img ? 'image' : 'video',
          url: post.img || post.video,
          height: post.imgHeight,
          isSensitive: post.isSensitive
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      media: allMedia
    });
    
  } catch (error: unknown) {
    console.error("მედიის მიღების შეცდომა:", error);
    return NextResponse.json(
      { error: "მედიის მიღება ვერ მოხერხდა" },
      { status: 500 }
    );
  }
}