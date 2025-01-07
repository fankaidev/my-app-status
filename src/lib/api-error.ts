import { NextResponse } from 'next/server'

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code: string = 'INTERNAL_SERVER_ERROR'
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export function handleApiError(error: unknown) {
    console.error('API Error:', error)

    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                error: {
                    message: error.message,
                    code: error.code
                }
            },
            { status: error.statusCode }
        )
    }

    // Handle unknown errors
    return NextResponse.json(
        {
            error: {
                message: 'An unexpected error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            }
        },
        { status: 500 }
    )
}

// Common API errors
export const ApiErrors = {
    Unauthorized: () => new ApiError('Authentication required', 401, 'UNAUTHORIZED'),
    NotFound: (resource: string) => new ApiError(`${resource} not found`, 404, 'NOT_FOUND'),
    BadRequest: (message: string) => new ApiError(message, 400, 'BAD_REQUEST'),
    Forbidden: (message = 'Access denied') => new ApiError(message, 403, 'FORBIDDEN'),
}