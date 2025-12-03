
export class ApiError extends Error {
    
    constructor(
        public statusCode: number,
        public message: string,
    ) {
        super(message);
    }

    static badRequest(message: string) {
        return new ApiError(400, message);
    }

    static notFound(message: string) {
        return new ApiError(404, message);
    }

    static unauthorized(message: string) {
        return new ApiError(401, message);
    }
}