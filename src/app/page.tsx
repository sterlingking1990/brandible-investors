"use client";

import { useSupabase } from "@/components/supabase-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: string;
};

type PerformanceData = {
  date: string;
  value: number;
};

type DashboardData = {
  summary: {
    totalInvestment: number;
    portfolioValue: number;
    totalReturns: number;
  };
  recentTransactions: Transaction[];
  performance: PerformanceData[];
};

export default function Home() {
  const { session } = useSupabase();
  const router = useRouter();
  const supabase = createClient();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Investor Dashboard</h1>
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
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Total Investment</h2>
            <p className="text-3xl font-bold text-gray-900">${dashboardData?.summary.totalInvestment.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Portfolio Value</h2>
            <p className="text-3xl font-bold text-green-600">${dashboardData?.summary.portfolioValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Total Returns</h2>
            <p className="text-3xl font-bold text-blue-600">${dashboardData?.summary.totalReturns.toLocaleString()}</p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Investment Performance</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dashboardData?.performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Description</th>
                  <th className="py-2 px-4 border-b">Amount</th>
                  <th className="py-2 px-4 border-b">Type</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 px-4 border-b">{tx.date}</td>
                    <td className="py-2 px-4 border-b">{tx.description}</td>
                    <td className={`py-2 px-4 border-b ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b">{tx.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
