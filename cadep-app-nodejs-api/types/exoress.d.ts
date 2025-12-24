import { AuthRequest } from '../middlewares/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        permissions: string[];
        tokenVersion: number;
      };
      allowedFields?: string[];
    }
  }
}