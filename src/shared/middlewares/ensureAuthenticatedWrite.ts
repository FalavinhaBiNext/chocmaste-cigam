import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const PUBLIC_PATHS = [
    '/auth/login',
    '/auth/register',
    '/events/health',
    '/bling/callback',
    '/bling/webhook',
];

interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

export function ensureAuthenticatedWrite(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'GET') {
        next();
        return;
    }

    const path = req.path.replace(/^\/api\/v1/, '');
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));
    if (isPublic) {
        next();
        return;
    }

    if (!WRITE_METHODS.includes(req.method)) {
        next();
        return;
    }

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
