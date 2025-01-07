import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { auth, handlers, signIn, signOut } = NextAuth({
    providers: [GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
    })],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    session: {
        strategy: "jwt",  // Required for edge runtime
    },
})

