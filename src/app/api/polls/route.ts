import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: polls, error } = await supabase
      .from('polls')
      .select('id, question, description, created_at, closes_at, status, author_id, profiles(full_name)')
      .eq('status', 'open')
      .gt('closes_at', new Date().toISOString()) // Only active polls
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }

    return NextResponse.json(polls);
  } catch (error: any) {
    console.error('Error in GET /api/polls:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
