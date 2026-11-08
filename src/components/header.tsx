"use client";

import Link from "next/link";
import { useUser } from "./use-user";

export function Header() {
  const { email, status } = useUser();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="hover:opacity-80">
              <h1 className="text-2xl font-bold text-gray-900">App Status Dashboard</h1>
              <p className="text-sm text-gray-600">Monitor your services</p>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="animate-pulse bg-gray-200 h-10 w-[150px] rounded" />
            ) : status === "authenticated" ? (
              <div className="flex items-center gap-4">
                <Link href="/admin" className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">
                  Admin
                </Link>
                <p className="text-sm text-gray-500">{email}</p>
                {/* Cloudflare Access logout endpoint */}
                <a
                  href="/cdn-cgi/access/logout"
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Sign out
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not signed in</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
