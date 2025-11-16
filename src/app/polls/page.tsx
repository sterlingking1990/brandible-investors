"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Poll = {
  id: string;
  question: string;
  description?: string;
  created_at: string;
  closes_at?: string;
  status: string;
  author_id: string;
  profiles: {
    full_name: string;
  };
};

export default function PollsListPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolls() {
      try {
        const response = await fetch('/api/polls');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Poll[] = await response.json();
        setPolls(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPolls();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p>Loading polls...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-red-500">Error loading polls: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">Investor Polls</h1>

        {polls.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No active polls available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {polls.map((poll) => (
              <Link href={`/polls/${poll.id}`} key={poll.id} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{poll.question}</h2>
                  {poll.description && <p className="text-sm text-gray-600 mb-3">{poll.description}</p>}
                  <p className="text-xs text-gray-500">
                    Closes: {poll.closes_at ? new Date(poll.closes_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <span className="text-indigo-600 hover:text-indigo-500 font-medium mt-3 block">View Poll &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
