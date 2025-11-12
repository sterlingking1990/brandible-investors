import { NextResponse } from 'next/server';

export async function GET() {
  const mockData = {
    summary: {
      totalInvestment: 50000,
      portfolioValue: 65000,
      totalReturns: 15000,
    },
    recentTransactions: [
      { id: 1, date: '2025-11-10', description: 'Investment in Brandible Series A', amount: -50000, type: 'investment' },
      { id: 2, date: '2025-11-11', description: 'Dividend Payout', amount: 1000, type: 'dividend' },
      { id: 3, date: '2025-11-12', description: 'Stock Sale', amount: 5000, type: 'sale' },
    ],
    performance: [
      { date: '2025-01-01', value: 50000 },
      { date: '2025-02-01', value: 52000 },
      { date: '2025-03-01', value: 55000 },
      { date: '2025-04-01', value: 54000 },
      { date: '2025-05-01', value: 58000 },
      { date: '2025-06-01', value: 60000 },
      { date: '2025-07-01', value: 62000 },
      { date: '2025-08-01', value: 61000 },
      { date: '2025-09-01', value: 63000 },
      { date: '2025-10-01', value: 65000 },
      { date: '2025-11-01', value: 65000 },
    ],
  };

  return NextResponse.json(mockData);
}
