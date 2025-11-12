"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Callback received:', { type, hasAccessToken: !!accessToken });

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(sessionError.message);
            setTimeout(() => router.push('/login'), 2000);
            return;
          }

          // If it's a password recovery, redirect to reset password page
          if (type === 'recovery') {
            console.log('Redirecting to reset password page');
            router.push('/reset-password');
          } else {
            console.log('Redirecting to dashboard');
            router.push('/dashboard');
          }
        } else {
          setError('Invalid authentication tokens');
          setTimeout(() => router.push('/login'), 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An error occurred during authentication');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your authentication.</p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}