// src/app/page.tsx
"use client";

import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const fetchToken = async () => {
      if (isLoaded) {
        const token = await getToken();
        console.log("JWT Token:", token);
        const templ = "testing-template";
        const tokentest = await getToken({ template: templ });
        console.log("JWT Token:", tokentest);
      }
    };
    fetchToken();
  }, [isLoaded, getToken]);

  if (!isLoaded)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Welcome to the Home Page</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        {userId ? (
          <div className="space-y-4">
            <p className="text-lg">
              You are logged in as{" "}
              <span className="font-semibold">
                {user?.emailAddresses[0].emailAddress}
              </span>
            </p>

            <SignOutButton>
              <button className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg">You are not logged in</p>
            <Link
              href="/sign-in"
              className="inline-block bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
