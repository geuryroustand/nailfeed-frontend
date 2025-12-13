"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function MobileRedirectPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const jwt = searchParams.get("jwt");
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");

    if (jwt && userId && username) {
      const deepLink = `nailfeedapp://auth/google/callback?jwt=${encodeURIComponent(
        jwt
      )}&userId=${userId}&username=${encodeURIComponent(username)}`;

      window.location.href = deepLink;

      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
          <p className="text-gray-600">Opening app...</p>
        </div>
      </div>
    </div>
  );
}
