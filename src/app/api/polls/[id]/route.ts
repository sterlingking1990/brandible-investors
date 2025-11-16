import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_poll_details_for_investor', {
      _poll_id: id,
    }).single(); // Use .single() as the RPC returns a single row

    if (rpcError) {
      console.error(`Error fetching poll details for investor with ID ${id}:`, rpcError);
      if (rpcError.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch poll details' }, { status: 500 });
    }

    // Map the RPC output to the format expected by the frontend
    const poll = {
      id: rpcData.id,
      question: rpcData.question,
      description: rpcData.description,
      created_at: rpcData.created_at,
      closes_at: rpcData.closes_at,
      status: rpcData.status,
      author_id: rpcData.author_id,
      profiles: {
        full_name: rpcData.author_full_name,
      },
      poll_options: rpcData.poll_options, // Already jsonb array
      userVote: rpcData.user_vote_option_id,
      pollResults: rpcData.poll_results, // Already jsonb array
    };

    return NextResponse.json(poll);
  } catch (error: any) {
    console.error(`Error in GET /api/polls/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
