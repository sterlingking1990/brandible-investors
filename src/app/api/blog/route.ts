import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = await createClient();

  try {
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('id, title, cover_image_url, created_at, published_at, author_id, profiles(full_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
    }

    return NextResponse.json(blogPosts);
  } catch (error: any) {
    console.error('Error in GET /api/blog:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
