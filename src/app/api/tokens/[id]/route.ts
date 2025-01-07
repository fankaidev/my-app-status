import { auth } from "@/auth";
import { getDB } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";
import { revokeToken } from "@/lib/token-utils";

export const runtime = "edge";

interface RouteContext {
    params: { id: string };
}

// DELETE /api/tokens/[id] - Revoke a token
export async function DELETE(request: Request, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw ApiErrors.Unauthorized();
        }

        const { id } = context.params;
        const db = await getDB();

        const success = await revokeToken(db, id, session.user.email);
        if (!success) {
            throw ApiErrors.NotFound("Token");
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error revoking token:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw ApiErrors.BadRequest("Failed to revoke token");
    }
}