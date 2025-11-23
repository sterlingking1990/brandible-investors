"use client";

import { useSupabase } from "@/components/supabase-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import Link from 'next/link';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: string;
  created_at: string;
};

type PerformanceData = {
  date: string;
  value: number;
};

type DashboardData = {
  user: {
    full_name: string;
    member_since?: string;
  };
  summary: {
    total_investment: number;
    portfolio_value: number;
    total_returns: number;
    investment_count: number;
  };
  recentTransactions: Transaction[];
  performance: PerformanceData[];
  investorLevel?: {
    role_name: string;
    interest_factor: number;
  };
};

export default function Home() {
  const { session } = useSupabase();
  const router = useRouter();
  const supabase = createClient();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // First, reauthenticate the user with their current password
    if (session?.user?.email) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

      if (reauthError) {
        setPasswordError("Invalid current password.");
        return;
      }
    }


    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordError(updateError.message);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");

        // Refresh session to ensure it stays valid
      await supabase.auth.refreshSession();
    }
  };

    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch("/api/dashboard");
  
          if (response.status === 401 || response.status === 403) {
            setRedirecting(true);
            setLoading(false); // Stop loading before redirect
            router.push("/login");
            return;
          } else if (!response.ok) {
            throw new Error("Failed to fetch dashboard data");
          }
  
          const data = await response.json();
  
          // Set data even if empty - we'll handle empty state in UI
          setDashboardData(data);
          setError(false);
          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
          // Check if it's an auth error that returned HTML instead of JSON
          if (error instanceof SyntaxError) {
            // Likely got HTML login page instead of JSON
            setRedirecting(true);
            setLoading(false);
            router.push("/login");
            return;
          }
          setError(true);
          setLoading(false);
        }
      };
  
      fetchData();
    }, [router]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center text-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Investor Dashboard</h1>
          <p className="text-gray-600 mb-8">
            Welcome to the Brandible Investor Dashboard. Log in to manage your investments, track performance, and view exclusive updates.
          </p>
          <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
            Get Started
          </Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  // Show error only if API call actually failed
  if (error || !dashboardData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-red-500">Failed to load dashboard data. Please try again later.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </main>
    );
  }

  // Provide default values for empty state
  const summary = dashboardData.summary || {
    total_investment: 0,
    portfolio_value: 0,
    total_returns: 0,
    investment_count: 0
  };

  const hasAnyData = summary.total_investment > 0 || 
                     summary.portfolio_value > 0 || 
                     summary.total_returns > 0 ||
                     (dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Welcome, {dashboardData.user?.full_name || 'Investor'}!</h1>
            <Link href="/blog" className="text-indigo-600 hover:text-indigo-500 font-medium">
              View Blog
            </Link>
            <Link href="/polls" className="text-indigo-600 hover:text-indigo-500 font-medium">
              View Polls
            </Link>
            
            {/* Investor Level Badge */}
            {dashboardData.investorLevel && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="text-center">
                  <p className="text-xs font-medium opacity-90">Investor Level</p>
                  <h3 className="text-sm font-bold">{dashboardData.investorLevel.role_name}</h3>
                  <p className="text-xs opacity-90">
                    {(dashboardData.investorLevel.interest_factor * 100).toFixed(2)}% Interest
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {session && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Welcome message for new users */}
        {!hasAnyData && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Welcome to your investment dashboard, {dashboardData.user?.full_name || 'Investor'}! You haven't made any investments yet. Start investing to track your portfolio performance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Investment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Investment</dt>
                  <dd className="text-2xl font-bold text-gray-900">${summary.total_investment.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Portfolio Value</dt>
                  <dd className="text-2xl font-bold text-green-600">${summary.portfolio_value.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Returns</dt>
                  <dd className={`text-2xl font-bold ${summary.total_returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.total_returns >= 0 ? '+' : ''}${summary.total_returns.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">ROI</dt>
                  <dd className={`text-2xl font-bold ${summary.total_investment > 0 && (summary.total_returns / summary.total_investment) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.total_investment > 0 
                      ? ((summary.total_returns / summary.total_investment) * 100).toFixed(1) 
                      : '0'
                    }%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Investment Performance</h2>
          {dashboardData?.performance && dashboardData.performance.length > 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">Performance chart will be displayed here.</p>
              <p className="text-sm text-gray-500">Chart functionality temporarily disabled for development.</p>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No performance data available yet. Make your first investment to see your portfolio grow!</p>
            </div>
          )}
        </div>

        {/* Dashboard Grid - Recent Transactions and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
              {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
                <span className="text-sm text-gray-500">
                  {dashboardData.recentTransactions.length} transaction{dashboardData.recentTransactions.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{tx.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No recent transactions found.</p>
                <p className="text-sm mt-1">Your investment activity will appear here.</p>
              </div>
            )}
          </div>

          {/* Quick Stats & Account Info */}
          <div className="space-y-6">
            
            {/* Investment Summary */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Count</span>
                  <span className="font-semibold">{summary.investment_count} investment{summary.investment_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Investment</span>
                  <span className="font-semibold">
                    ${summary.total_investment > 0 && summary.investment_count > 0 
                      ? (summary.total_investment / summary.investment_count).toLocaleString() 
                      : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Portfolio Growth</span>
                  <span className={`font-semibold ${summary.total_returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.total_investment > 0 
                      ? ((summary.total_returns / summary.total_investment) * 100).toFixed(1)
                      : '0'
                    }%
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active Investor
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {dashboardData?.user?.member_since 
                      ? new Date(dashboardData.user.member_since).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Portfolio Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    summary.total_investment > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {summary.total_investment > 0 ? 'Invested' : 'No Investments'}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Reset Password</h4>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                  {passwordSuccess && <p className="text-green-500 text-sm">Password updated successfully!</p>}
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
