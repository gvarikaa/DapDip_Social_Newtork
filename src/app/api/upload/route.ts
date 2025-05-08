import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/prisma";
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToBunny } from "@/utils/bunnyUtils";


type MediaSettings = {
  fileName: string;
  type: "original" | "wide" | "square";
  sensitive: boolean;
};

export async function POST(request: Request) {
  try {
    // ავტორიზაციის შემოწმება Supabase-ით
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
    }
    
    // მივიღოთ formData
    const formData = await request.formData();
    const files = formData.getAll('files');
    const postId = formData.get('postId') as string;
    const captions = JSON.parse(formData.get('captions') as string || '{}');
    
    // მედიის პარამეტრები - თითოეული ფაილისთვის
    const mediaSettingsStr = formData.get('mediaSettings') as string;
    const mediaSettings = mediaSettingsStr ? JSON.parse(mediaSettingsStr) : [];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "ფაილები არ აიტვირთა" }, { status: 400 });
    }

    const uploadedMedia = [];
    
    for (const file of files) {
      if (!(file instanceof File)) continue;
      
      // უნიკალური ID და ფაილის სახელის შექმნა
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.name.replace(/\s+/g, '_')}`;
      
      // ფაილის Buffer-ში გადაყვანა
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // ფაილის ტიპის განსაზღვრა
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      
      // გამოვიძიოთ ამ ფაილის პარამეტრები
      const settings = mediaSettings.find((s: { fileName: string; }) => s.fileName === file.name) || {
        type: "original" as const,
        sensitive: false
      };
      
      // ატვირთვა Bunny Storage-ზე (server mode)
      const uploadResult = await uploadFileToBunny(buffer, fileName, "/posts", true);
      
      if (!uploadResult.success) {
        console.error(`ფაილის ატვირთვის შეცდომა: ${fileName}`);
        continue;
      }
      
      // მედია ობიექტის შექმნა
      const mediaRecord = await prisma.media.create({
        data: {
          id: fileId,
          type: fileType,
          url: uploadResult.url,
          thumbnailUrl: fileType === 'video' ? uploadResult.url : null,
          width: fileType === 'image' ? 600 : null,
          height: fileType === 'image' ? 600 : null,
          caption: captions[file.name] || null,
          isSensitive: settings.sensitive || false,
          postId: postId ? parseInt(postId) : null,
          userId: userId, // უზრუნველვყოთ რომ მედია მიბმულია მომხმარებელზე
          // დამატებული მედიის პარამეტრები
          displayType: settings.type || "original",
        },
      });
      
      uploadedMedia.push(mediaRecord);
    }
    
    // თუ ნებისმიერი მედია არის სენსიტიური, განვაახლოთ პოსტიც
    if (uploadedMedia.some(media => media.isSensitive) && postId) {
      await prisma.post.update({
        where: { id: parseInt(postId) },
        data: { isSensitive: true }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      media: uploadedMedia 
    });
    
  } catch (error) {
    console.error('შეცდომა ატვირთვისას:', error);
    return NextResponse.json(
      { error: 'ფაილების დამუშავება ვერ მოხერხდა' },
      { status: 500 }
    );
  }
}