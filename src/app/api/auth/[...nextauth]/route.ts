import { handlers } from "@/auth"

export const runtime = 'edge'

// Explicitly export HTTP methods for Next.js 14
export const GET = handlers.GET
export const POST = handlers.POST