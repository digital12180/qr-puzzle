import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};