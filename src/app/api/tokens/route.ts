import { auth } from "@/auth";
import { getDB } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";
import { createUserToken, listUserTokens } from "@/lib/token-utils";

export const runtime = "edge";

interface CreateTokenRequest {
    name: string;
}

// GET /api/tokens - List all tokens for current user
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw ApiErrors.Unauthorized();
        }

        const db = await getDB();
        const tokens = await listUserTokens(db, session.user.email);

        return Response.json(tokens);
    } catch (error) {
        console.error("Error listing tokens:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw ApiErrors.BadRequest("Failed to list tokens");
    }
}

// POST /api/tokens - Create a new token
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw ApiErrors.Unauthorized();
        }

        const body = await request.json() as CreateTokenRequest;
        if (!body?.name) {
            throw ApiErrors.BadRequest("Token name is required");
        }

        const db = await getDB();
        const { token, id } = await createUserToken(db, session.user.email, body.name);

        return Response.json({ token, id }, { status: 201 });
    } catch (error) {
        console.error("Error creating token:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw ApiErrors.BadRequest("Failed to create token");
    }
}