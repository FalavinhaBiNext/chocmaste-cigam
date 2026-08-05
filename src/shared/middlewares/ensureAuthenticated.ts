import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Token de autenticação não fornecido.'
        });
        return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'chocmaster-jwt-secret';

    try {
        const decoded = jwt.verify(token, secret) as TokenPayload;
        (req as any).user = decoded;
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: 'Token de autenticação inválido ou expirado.'
        });
    }
}
