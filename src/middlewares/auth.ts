import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("secret introuvable");

export const authentifierToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send("Token manquant");

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).send("Session expirée ou token invalide");
        req.user = user;
        next();
    });
};


export const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,
    message: { message: "Trop de tentatives veuillez réessayer dans 30 minutes" }
});