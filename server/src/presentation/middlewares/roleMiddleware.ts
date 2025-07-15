// import { Request, Response, NextFunction } from 'express';
//    import { verify } from 'jsonwebtoken';
//    import { TokenPayload } from '../../shared/AuthType';

//    export const roleMiddleware = (allowedRoles: string[]) => {
//        return (req: Request, res: Response, next: NextFunction) => {
//            const authHeader = req.headers.authorization;
//            if (!authHeader) {
//                return res.status(401).json({ success: false, message: 'No token provided' });
//            }

//            const token = authHeader.split(' ')[1];
//            try {
//                const payload = verify(token, process.env.JWT_SECRET!) as TokenPayload;
//                if (!allowedRoles.includes(payload.role)) {
//                    return res.status(403).json({ success: false, message: 'Access denied' });
//                }
//                req.user = payload;
//                next();
//            } catch (error) {
//                return res.status(401).json({ success: false, message: 'Invalid token' });
//            }
//        };
//    }