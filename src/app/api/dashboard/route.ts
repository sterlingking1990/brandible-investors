import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, user_type, created_at')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found for this user.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
    }

    // Check if user is marked as investor in profile
    if (profileData?.user_type !== 'investor') {
      console.log('User is not an investor type, access forbidden.');
      return NextResponse.json({ error: 'Forbidden: User is not an investor.' }, { status: 403 });
    }

    // Check if investor record exists 
    const { data: investorData, error: investorCheckError } = await supabase
      .from('investors')
      .select('id, level_id')
      .eq('profile_id', user.id)
      .single();

    if (investorCheckError) {
        console.error('Investor check error:', investorCheckError);
        // If the error is that no rows were found, we can handle that gracefully
        if (investorCheckError.code === 'PGRST116') {
            const emptyDashboard = {
                user: profileData,
                summary: { total_investment: 0, portfolio_value: 0, total_returns: 0 },
                recentTransactions: [],
                performance: [],
            };
            return NextResponse.json(emptyDashboard);
        }
        return NextResponse.json({ error: 'Failed to fetch investor data' }, { status: 500 });
    }


    // Get investor level data using RPC function (bypasses RLS)
    let investorLevelData = null;
    if (investorData?.id) {
      const { data: levelData, error: levelError } = await supabase
        .rpc('get_investor_level', { p_user_id: user.id });
      
      if (levelError) {
        console.error('Failed to get level data:', levelError);
        // Decide if you want to fail the whole request or just proceed without level data
      } else if (levelData && levelData.length > 0) {
        investorLevelData = levelData[0];
      }
    }

    // Now we can safely call the RPC functions
    let summaryData, transactionsData, performanceData;

    // Fetch summary data
    const { data: summary, error: summaryError } = await supabase.rpc('get_investor_dashboard_summary', { p_user_id: user.id });
    if (summaryError) {
        console.error('Summary RPC error:', summaryError);
        return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
    }
    summaryData = summary;

    // Fetch recent transactions
    const { data: transactions, error: transactionsError } = await supabase.rpc('get_investor_recent_transactions', { p_user_id: user.id });
    if (transactionsError) {
        console.error('Transactions RPC error:', transactionsError);
        return NextResponse.json({ error: 'Failed to fetch recent transactions' }, { status: 500 });
    }
    transactionsData = transactions;

    // Fetch performance data
    const { data: performance, error: performanceError } = await supabase.rpc('get_investor_performance_data', { p_user_id: user.id });
    if (performanceError) {
        console.error('Performance RPC error:', performanceError);
        return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
    }
    performanceData = performance;
    
    const dashboardData = {
      user: {
        full_name: profileData?.full_name,
        member_since: profileData?.created_at,
      },
      summary: (summaryData && summaryData.length > 0) ? summaryData[0] : { total_investment: 0, portfolio_value: 0, total_returns: 0 },
      recentTransactions: transactionsData || [],
      performance: performanceData || [],
      investorLevel: investorLevelData ? {
        role_name: investorLevelData.role_name,
        interest_factor: investorLevelData.interest_factor,
      } : null,
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
