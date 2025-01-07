interface ApiError {
    message: string
    code: string
}

interface ApiResponse<T> {
    data?: T
    error?: ApiError
}

interface ApiErrorResponse {
    error: ApiError
}

export async function fetchApi<T extends object>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(url, options)
        const data = await res.json() as T | ApiErrorResponse

        if (!res.ok) {
            // If the server returns an error object, use it
            if ('error' in data) {
                return { error: data.error }
            }

            // Otherwise, create a generic error
            return {
                error: {
                    message: 'An unexpected error occurred',
                    code: 'UNKNOWN_ERROR'
                }
            }
        }

        return { data: data as T }
    } catch (error) {
        console.error('API Client Error:', error)
        return {
            error: {
                message: 'Failed to connect to the server',
                code: 'NETWORK_ERROR'
            }
        }
    }
}

// Common error messages for user display
export const ErrorMessages = {
    UNAUTHORIZED: 'Please sign in to continue',
    NOT_FOUND: 'The requested resource was not found',
    NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
    getErrorMessage: (error?: ApiError) => {
        if (!error) return ErrorMessages.UNKNOWN_ERROR

        switch (error.code) {
            case 'UNAUTHORIZED':
                return ErrorMessages.UNAUTHORIZED
            case 'NOT_FOUND':
                return ErrorMessages.NOT_FOUND
            case 'NETWORK_ERROR':
                return ErrorMessages.NETWORK_ERROR
            default:
                return error.message || ErrorMessages.UNKNOWN_ERROR
        }
    }
}