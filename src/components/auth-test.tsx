'use client'

import { signIn, signOut, useSession } from "next-auth/react"

export function AuthTest() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <div>Loading...</div>
    }

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <p>Signed in as {session.user?.email}</p>
                <button
                    onClick={() => signOut()}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Sign out
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => signIn("github")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
            Sign in with GitHub
        </button>
    )
}