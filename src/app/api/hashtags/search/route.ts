import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';

export async function GET(request: NextRequest) {
  try {
    // URL პარამეტრების პარსვა
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    if (!query) {
      return NextResponse.json(
        { error: 'საძიებო ტერმინი აუცილებელია' },
        { status: 400 }
      );
    }
    
    // საძიებო წინსართის მომზადება
    const searchTerm = query.startsWith('#') ? query.substring(1) : query;
    
    // ჰეშთეგების ძებნა
    const hashtags = await prisma.hashtag.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive'  // case-insensitive ძებნა
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: [
        {
          posts: {
            _count: 'desc'
          }
        },
        {
          name: 'asc'
        }
      ],
      take: limit
    });
    
    // მონაცემების ფორმატირება
    const formattedResults = hashtags.map(hashtag => ({
      id: hashtag.id,
      tag: hashtag.name,
      count: hashtag._count.posts,
      posts: hashtag._count.posts
    }));
    
    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Error searching hashtags:', error);
    return NextResponse.json(
      { error: 'ჰეშთეგების ძებნა ვერ მოხერხდა' },
      { status: 500 }
    );
  }
}