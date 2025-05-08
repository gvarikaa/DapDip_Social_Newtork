"use server";

import { auth } from "@/utils/supabase/auth";
import { prisma } from "./prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { extractHashtags, saveHashtags } from "./utils/hashtagUtils";
import { uploadFileToBunny } from "./utils/bunnyUtils";

// API URL-ის გენერირების ჰელპერი ფუნქცია
const getApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const followUser = async (targetUserId: string) => {
  const { userId } = await auth();

  if (!userId) return;

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: { id: existingFollow.id },
    });
  } else {
    await prisma.follow.create({
      data: { followerId: userId, followingId: targetUserId },
    });
  }
};

export const likePost = async (postId: number) => {
  const { userId } = await auth();

  if (!userId) return;

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId,
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    await prisma.like.create({
      data: { userId, postId },
    });
  }
};

export const rePost = async (postId: number) => {
  const { userId } = await auth();

  if (!userId) return;

  const existingRePost = await prisma.post.findFirst({
    where: {
      userId: userId,
      rePostId: postId,
    },
  });

  if (existingRePost) {
    await prisma.post.delete({
      where: { id: existingRePost.id },
    });
  } else {
    await prisma.post.create({
      data: { userId, rePostId: postId },
    });
  }
};

export const savePost = async (postId: number) => {
  const { userId } = await auth();

  if (!userId) return;

  const existingSavedPost = await prisma.savedPosts.findFirst({
    where: {
      userId: userId,
      postId: postId,
    },
  });

  if (existingSavedPost) {
    await prisma.savedPosts.delete({
      where: { id: existingSavedPost.id },
    });
  } else {
    await prisma.savedPosts.create({
      data: { userId, postId },
    });
  }
};

export const addComment = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const { userId } = await auth();

  if (!userId) return { success: false, error: true };

  const postId = formData.get("postId");
  const username = formData.get("username");
  const desc = formData.get("desc");

  const Comment = z.object({
    parentPostId: z.number(),
    desc: z.string().max(2200),
  });

  const validatedFields = Comment.safeParse({
    parentPostId: Number(postId),
    desc,
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { success: false, error: true };
  }

  try {
    // შევქმნათ კომენტარი
    const newComment = await prisma.post.create({
      data: {
        ...validatedFields.data,
        userId,
      },
    });

    console.log("კომენტარი წარმატებით შეიქმნა:", newComment);

    // ამოვიცნოთ და შევინახოთ ჰეშთეგები
    if (validatedFields.data.desc) {
      const hashtags = extractHashtags(validatedFields.data.desc as string);
      if (hashtags.length > 0) {
        await saveHashtags(newComment.id, hashtags);
      }
    }

    revalidatePath(`/${username}/status/${postId}`);
    return { success: true, error: false };
  } catch (err) {
    console.log("კომენტარის შექმნის შეცდომა:", err);
    return { success: false, error: true };
  }
};

// ფაილის ატვირთვის ფუნქცია - Bunny.net-ის გამოყენებით
const uploadFile = async (file: any, imgType: string): Promise<any> => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // განვსაზღვროთ დირექტორია
  const directory = "posts";
  
  // შევქმნათ უნიკალური ფაილის სახელი
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;

  try {
    // ავტვირთოთ ფაილი Bunny.net-ზე (server mode)
    const result = await uploadFileToBunny(buffer, fileName, directory, true);
    
    if (!result.success) {
      throw new Error(`ფაილის ატვირთვა ვერ მოხერხდა: ${result.statusCode}`);
    }
    
    // დავაბრუნოთ შედეგი
    return {
      url: result.url,
      filePath: result.url,
      fileType: file.type.includes("image") ? "image" : "video",
      height: imgType === "square" ? 600 : null,
      width: imgType === "wide" ? 800 : 600,
    };
  } catch (error) {
    console.error("ფაილის ატვირთვის შეცდომა:", error);
    throw error;
  }
};

// მრავალი ფაილის ატვირთვა - განახლებული Bunny.net-ისთვის
export const uploadMultipleFiles = async (
  files: any[],
  imgType: string,
  isSensitive: boolean,
  desc: string,
  userId: string
): Promise<any[]> => {
  console.log("მრავალი ფაილის ატვირთვა: ", files.length, "ფაილი");
  
  const uploadPromises = files.map(async (file) => {
    let img = "";
    let imgHeight = 0;
    let video = "";

    try {
      console.log("ვტვირთავ ფაილს:", file.name, "ტიპი:", file.type);
      const result = await uploadFile(file, imgType);
      console.log("ატვირთვის შედეგი:", result);
      
      if (result.fileType === "image") {
        img = result.url;
        imgHeight = result.height || 0;
      } else {
        video = result.url;
      }
      
      // თითოეული ფაილისთვის შევქმნათ პოსტი
      const post = await prisma.post.create({
        data: {
          desc,
          userId,
          isSensitive,
          img,
          imgHeight,
          video,
        },
      });
      
      console.log("შექმნილი პოსტი:", post);
      
      // ჰეშთეგების დამუშავება
      if (desc) {
        const hashtags = extractHashtags(desc);
        if (hashtags.length > 0) {
          await saveHashtags(post.id, hashtags);
        }
      }
      
      return post;
    } catch (error) {
      console.error("ფაილის ატვირთვის შეცდომა:", error);
      throw error;
    }
  });
  
  return Promise.all(uploadPromises);
};

export const addPost = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const { userId } = await auth();

  if (!userId) {
    console.log("მომხმარებელი არ არის ავტორიზებული");
    return { success: false, error: true };
  }

  const desc = formData.get("desc");
  const file = formData.get("file");
  const files = formData.getAll("files");
  const isSensitive = formData.get("isSensitive") as string;
  const imgType = formData.get("imgType");

  console.log("პოსტის დამატების მცდელობა:", {
    desc,
    fileExists: !!file,
    filesCount: files.length,
    isSensitive,
    imgType
  });

  const Post = z.object({
    desc: z.string().max(2200),
    isSensitive: z.boolean().optional(),
  });

  const validatedFields = Post.safeParse({
    desc,
    isSensitive: JSON.parse(isSensitive || "false"),
  });

  if (!validatedFields.success) {
    console.log("ვალიდაციის შეცდომა:", validatedFields.error.flatten().fieldErrors);
    return { success: false, error: true };
  }

  try {
    // მრავალი ფაილის შემთხვევა
    if (files && files.length > 0) {
      console.log("ვტვირთავ რამდენიმე ფაილს:", files.length);
      
      await uploadMultipleFiles(
        files,
        imgType as string,
        validatedFields.data.isSensitive || false,
        validatedFields.data.desc as string,
        userId
      );
      
      console.log("მრავალი ფაილი წარმატებით აიტვირთა");
      revalidatePath(`/`);
      return { success: true, error: false };
    }
    
    // ერთი ფაილის შემთხვევა
    let img = "";
    let imgHeight = 0;
    let video = "";

    if (file && typeof file === 'object' && 'size' in file && file.size > 0) {
      try {
        console.log("ვტვირთავ ერთ ფაილს:", 'name' in file ? file.name : 'უცნობი', "ტიპი:", 'type' in file ? file.type : 'უცნობი');
        const result = await uploadFile(file, imgType as string);
        console.log("ატვირთვის შედეგი:", result);

        if (result.fileType === "image") {
          img = result.filePath;
          imgHeight = result.height;
        } else {
          video = result.filePath;
        }
      } catch (error) {
        console.error("ფაილის ატვირთვის შეცდომა:", error);
        return { success: false, error: true };
      }
    }

    // შევქმნათ პოსტი
    const newPost = await prisma.post.create({
      data: {
        ...validatedFields.data,
        userId,
        img,
        imgHeight,
        video,
      },
    });

    console.log("პოსტი წარმატებით შეიქმნა:", newPost);

    // ამოვიცნოთ და შევინახოთ ჰეშთეგები, თუ ტექსტი არსებობს
    if (validatedFields.data.desc) {
      const hashtags = extractHashtags(validatedFields.data.desc as string);
      if (hashtags.length > 0) {
        await saveHashtags(newPost.id, hashtags);
      }
    }

    revalidatePath(`/`);
    return { success: true, error: false };
  } catch (err) {
    console.error('პოსტის შექმნისას შეცდომა:', err);
    return { success: false, error: true };
  }
};