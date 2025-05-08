import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { getSupabaseServer } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // ავთენტიფიკაციის შემოწმება (არააუცილებელია)
    const supabase = await getSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    
    // URL პარამეტრების პარსვა
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const timeframe = url.searchParams.get('timeframe') || 'week'; // day, week, month, all
    
    // დროის შუალედის დადგენა
    let date: Date | null = null;
    if (timeframe === 'day') {
      date = new Date(Date.now() - 24 * 60 * 60 * 1000); // ბოლო 24 საათი
    } else if (timeframe === 'week') {
      date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // ბოლო კვირა
    } else if (timeframe === 'month') {
      date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // ბოლო თვე
    }
    
    // ტრენდული ჰეშთეგების გამოთვლა
    const trendingHashtags = await prisma.hashtag.findMany({
      where: date ? {
        posts: {
          some: {
            createdAt: {
              gte: date
            }
          }
        }
      } : undefined,
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: limit,
      skip: offset
    });
    
    // მონაცემების ფორმატირება პასუხისთვის
    const formattedHashtags = trendingHashtags.map(hashtag => ({
      id: hashtag.id,
      tag: hashtag.name,
      count: hashtag._count.posts,
      posts: hashtag._count.posts
    }));
    
    return NextResponse.json(formattedHashtags);
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return NextResponse.json(
      { error: 'ტრენდული ჰეშთეგების ჩატვირთვა ვერ მოხერხდა' },
      { status: 500 }
    );
  }
}