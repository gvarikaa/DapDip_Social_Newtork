// src/app/api/user/cover/route.ts
import { prisma } from "@/prisma";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { uploadFileToBunny } from "@/utils/bunnyUtils";
import { v4 as uuidv4 } from "uuid";


export async function PUT(request: NextRequest) {
  // ავტორიზაციის შემოწმება Supabase-ით
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: "ავტორიზებული არ ხართ" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { coverType, coverUrl } = body;
    
    // მომხმარებლის განახლება
    await prisma.user.update({
      where: { id: userId },
      data: { 
        cover: coverUrl,
        // მომავალში შეგიძლიათ შეინახოთ coverType სქემაში
      }
    });
    
    return NextResponse.json({ 
      message: "ქოვერი განახლებულია" 
    });
  } catch (error) {
    console.error("ქოვერის განახლების შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}

// მეთოდი ქოვერის ფაილის ატვირთვისთვის
export async function POST(request: NextRequest) {
  // ავტორიზაციის შემოწმება Supabase-ით
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: "ავტორიზებული არ ხართ" },
      { status: 401 }
    );
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "ფაილი არ არის მითითებული" },
        { status: 400 }
      );
    }
    
    // ფაილის ბუფერად გარდაქმნა
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // უნიკალური ფაილის სახელის შექმნა
    const fileId = uuidv4();
    const fileName = `${fileId}_${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
    
    // ფაილის ატვირთვა Bunny.net-ზე სერვერის მხარეს
    const uploadResult = await uploadFileToBunny(buffer, fileName, "covers", true);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: "ფაილის ატვირთვა ვერ მოხერხდა" },
        { status: 500 }
      );
    }
    
    // მომხმარებლის განახლება
    await prisma.user.update({
      where: { id: userId },
      data: { cover: uploadResult.url }
    });
    
    return NextResponse.json({ 
      message: "ქოვერი ატვირთულია",
      coverUrl: uploadResult.url
    });
  } catch (error) {
    console.error("ქოვერის ატვირთვის შეცდომა:", error);
    return NextResponse.json({ error: "სერვერის შეცდომა" }, { status: 500 });
  }
}