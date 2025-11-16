import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id: pollId } = params;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { option_id } = await request.json();

    if (!option_id) {
      return NextResponse.json({ error: 'Option ID is required' }, { status: 400 });
    }

    // Check if the poll is still open
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('closes_at, status')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.status !== 'open' || (poll.closes_at && new Date(poll.closes_at) < new Date())) {
      return NextResponse.json({ error: 'Poll is closed or not active' }, { status: 400 });
    }

    // Check if user has already voted on this poll
    const { data: existingVote, error: existingVoteError } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voter_id', user.id)
      .single();

    if (existingVoteError && existingVoteError.code !== 'PGRST116') { // PGRST116 means no vote found, which is fine
      console.error('Error checking existing vote:', existingVoteError);
      return NextResponse.json({ error: 'Failed to check existing vote' }, { status: 500 });
    }

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this poll' }, { status: 409 });
    }

    // Insert the new vote
    const { error: insertError } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        poll_option_id: option_id,
        voter_id: user.id,
      });

    if (insertError) {
      console.error('Error casting vote:', insertError);
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vote cast successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error in POST /api/polls/${pollId}/vote:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
