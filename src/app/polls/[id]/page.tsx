"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type PollOption = {
  id: string;
  option_text: string;
};

type PollResult = {
  option_id: string;
  option_text: string;
  votes: number;
  percentage: number;
};

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
  poll_options: PollOption[];
  userVote?: string; // ID of the option the user voted for
  pollResults?: PollResult[];
};

export default function PollPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<string | null>(null); // 'success', 'error', 'already_voted'

  const fetchPollData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/polls/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Poll = await response.json();
      setPoll(data);
      if (data.userVote) {
        setSelectedOption(data.userVote);
        setVoteStatus('already_voted');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPollData();
  }, [id]);

  const handleVote = async () => {
    if (!selectedOption || !id) return;

    setLoading(true);
    setVoteStatus(null);
    try {
      const response = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ option_id: selectedOption }),
      });

      if (response.status === 409) { // Conflict - already voted
        setVoteStatus('already_voted');
        window.alert('Already Voted: You have already voted on this poll.');
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      } else {
        setVoteStatus('success');
        window.alert('Vote Cast: Your vote has been recorded successfully!');
        // Re-fetch poll data to show updated results
        fetchPollData();
      }
    } catch (e: any) {
      setVoteStatus('error');
      setError(e.message);
      window.alert(`Error: Failed to cast vote: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p>Loading poll...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-red-500">Error loading poll: {error}</p>
        <Link href="/polls" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Polls
        </Link>
      </main>
    );
  }

  if (!poll) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-gray-700">Poll not found.</p>
        <Link href="/polls" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Polls
        </Link>
      </main>
    );
  }

  const isPollClosed = poll.closes_at && new Date(poll.closes_at) < new Date();
  const hasVoted = poll.userVote !== undefined && poll.userVote !== null;
  const canVote = !isPollClosed && !hasVoted;

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="container mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-10">
        <Link href="/polls" className="text-indigo-600 hover:text-indigo-500 font-medium mb-4 block">
          &larr; Back to Polls
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{poll.question}</h1>
        {poll.description && <p className="text-gray-700 mb-6">{poll.description}</p>}
        <p className="text-sm text-gray-600 mb-6">
          Created by {poll.profiles?.full_name || 'Unknown Author'} on {new Date(poll.created_at).toLocaleDateString()}
          {poll.closes_at && ` | Closes: ${new Date(poll.closes_at).toLocaleDateString()}`}
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Options</h2>
          {poll.poll_options.length === 0 ? (
            <p className="text-gray-500">No options available for this poll.</p>
          ) : (
            <div className="space-y-4">
              {poll.poll_options.map((option) => (
                <label key={option.id} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="pollOption"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={() => setSelectedOption(option.id)}
                    disabled={!canVote}
                    className="form-radio h-5 w-5 text-indigo-600"
                  />
                  <span className="ml-3 text-lg text-gray-800">{option.option_text}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {canVote && (
          <button
            onClick={handleVote}
            disabled={!selectedOption || loading}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Casting Vote...' : 'Cast Your Vote'}
          </button>
        )}

        {hasVoted && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
            <p className="font-bold">You have voted!</p>
            <p>Your choice: {poll.poll_options.find(opt => opt.id === poll.userVote)?.option_text}</p>
          </div>
        )}

        {isPollClosed && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Poll Closed!</p>
            <p>Voting for this poll has ended.</p>
          </div>
        )}

        {(hasVoted || isPollClosed) && poll.pollResults && poll.pollResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Poll Results</h2>
            <div className="space-y-4">
              {poll.pollResults.map((result) => (
                <div key={result.option_id} className="flex items-center">
                  <div className="w-1/3 text-gray-700 font-medium">{result.option_text}</div>
                  <div className="w-2/3 bg-gray-200 rounded-full h-6 flex items-center">
                    <div
                      className="bg-indigo-600 h-full rounded-full text-white text-right pr-2 flex items-center justify-end"
                      style={{ width: `${result.percentage}%` }}
                    >
                      {result.percentage.toFixed(1)}% ({result.votes} votes)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
