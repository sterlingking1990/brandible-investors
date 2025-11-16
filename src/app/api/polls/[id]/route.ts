import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = await createClient();

  // Define the type for your RPC response
interface PollDetailsRPC {
  id: string;
  question: string;
  description: string | null;
  created_at: string;
  closes_at: string | null;
  status: string;
  author_id: string;
  author_full_name: string;
  poll_options: Array<{
    id: string;
    option_text: string;
    option_order: number;
  }>;
  user_vote_option_id: string | null;
  poll_results: Array<{
    option_id: string;
    option_text: string;
    vote_count: number;
    percentage: number;
  }>;
}

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
    const rpcDataTyped = rpcData as PollDetailsRPC;
    const poll = {
      id: rpcDataTyped.id,
      question: rpcDataTyped.question,
      description: rpcDataTyped.description,
      created_at: rpcDataTyped.created_at,
      closes_at: rpcDataTyped.closes_at,
      status: rpcDataTyped.status,
      author_id: rpcDataTyped.author_id,
      profiles: {
        full_name: rpcDataTyped.author_full_name,
      },
      poll_options: rpcDataTyped.poll_options, // Already jsonb array
      userVote: rpcDataTyped.user_vote_option_id,
      pollResults: rpcDataTyped.poll_results, // Already jsonb array
    };

    return NextResponse.json(poll);
  } catch (error: any) {
    console.error(`Error in GET /api/polls/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
