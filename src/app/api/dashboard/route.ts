import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

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
      throw profileError;
    }

    // Check if user is marked as investor in profile
    if (profileData?.user_type !== 'investor') {
      console.log('User is not an investor type, returning empty dashboard');
      const emptyDashboard = {
        user: { full_name: profileData?.full_name || 'User' },
        summary: { total_investment: 0, portfolio_value: 0, total_returns: 0 },
        recentTransactions: [],
        performance: [],
      };
      return NextResponse.json(emptyDashboard);
    }

    // Check if investor record exists 
    const { data: investorData, error: investorCheckError } = await supabase
      .from('investors')
      .select('id, level_id')
      .eq('profile_id', user.id)
      .single();

    // Get investor level data using RPC function (bypasses RLS)
    let investorLevelData = null;
    console.log('Investor data:', JSON.stringify(investorData, null, 2));
    
    if (investorData?.id) {
      console.log('Fetching level using RPC for user:', user.id);
      const { data: levelData, error: levelError } = await supabase
        .rpc('get_investor_level', { p_user_id: user.id });
      
      console.log('Level data response:', { levelData, levelError });
      
      if (!levelError && levelData && levelData.length > 0) {
        investorLevelData = levelData[0];
        console.log('Setting investor level data:', investorLevelData);
      } else {
        console.log('Failed to get level data:', levelError);
      }
    } else {
      console.log('No investor data found');
    }

    if (investorCheckError || !investorData) {
      console.log('No investor record found, returning empty dashboard');
      const emptyDashboard = {
        user: profileData,
        summary: { total_investment: 0, portfolio_value: 0, total_returns: 0 },
        recentTransactions: [],
        performance: [],
      };
      return NextResponse.json(emptyDashboard);
    }

    // Now we can safely call the RPC functions
    let summaryData, transactionsData, performanceData;

    // Fetch summary data
    try {
      const { data, error } = await supabase.rpc('get_investor_dashboard_summary', { p_user_id: user.id });
      if (error) throw error;
      summaryData = data;
    } catch (summaryError: any) {
      console.error('Summary RPC error:', summaryError);
      summaryData = [];
    }

    // Fetch recent transactions
    try {
      const { data, error } = await supabase.rpc('get_investor_recent_transactions', { p_user_id: user.id });
      if (error) throw error;
      transactionsData = data;
    } catch (transactionsError: any) {
      console.error('Transactions RPC error:', transactionsError);
      transactionsData = [];
    }

    // Fetch performance data
    try {
      const { data, error } = await supabase.rpc('get_investor_performance_data', { p_user_id: user.id });
      if (error) throw error;
      performanceData = data;
    } catch (performanceError: any) {
      console.error('Performance RPC error:', performanceError);
      performanceData = [];
    }

    console.log('Investor data with levels:', JSON.stringify(investorData, null, 2));
    
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

    console.log('Final dashboard data:', JSON.stringify(dashboardData, null, 2));

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
