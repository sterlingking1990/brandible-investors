import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = await createClient();

  try {
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error(`Error fetching blog post with ID ${id}:`, error);
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Blog post not found or not published' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
    }

    return NextResponse.json(blogPost);
  } catch (error: any) {
    console.error(`Error in GET /api/blog/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
