
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

    static forbidden(message: string) {
        return new ApiError(403, message);
    }
    // Peux être utiliser dans le cadre d'une existance de données
    static conflict(message: string) {
        return new ApiError(409, message);
    }

    static tooManyRequests(message: string) {
        return new ApiError(429, message);
    }

    static internal(message: string = 'Erreur serveur') {
        return new ApiError(500, message);
    }

} 