'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function MobileCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'redirecting' | 'manual'>('redirecting');

  useEffect(() => {
    const jwt = searchParams.get('jwt');
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (!jwt) {
      console.error('No JWT found in redirect');
      setStatus('manual');
      return;
    }

    // Build the deep link URL for the Expo app
    const appUrl = `nailfeedapp://auth/google/callback?jwt=${encodeURIComponent(
      jwt
    )}&userId=${encodeURIComponent(userId ?? '')}&username=${encodeURIComponent(
      username ?? ''
    )}`;

    console.log('Attempting deep link redirect to app:', appUrl);

    // Perform client-side redirect to deep link
    window.location.href = appUrl;

    // Show manual close message after 2 seconds if redirect didn't work
    const timer = setTimeout(() => {
      setStatus('manual');
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
      <div className="text-center text-white p-8 max-w-md">
        {status === 'redirecting' ? (
          <>
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Redirecting to NailFeed...</h2>
            <p className="text-white/90">Opening the app now...</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">Authentication Successful!</h2>
            <p className="text-white/90 mb-4">
              Please close this window and return to the NailFeed app.
            </p>
            <button
              onClick={() => {
                try {
                  window.close();
                } catch (e) {
                  console.log('Cannot auto-close window');
                }
              }}
              className="px-6 py-2 bg-white text-pink-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
