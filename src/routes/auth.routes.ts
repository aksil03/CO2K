import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginFormSchema, InscriptionFormSchema } from '../lib/types';
import { authLimiter } from '../middlewares/auth';
import { ajouterUtilisateur, getMail } from '@/lib/queries/utilisateur.queries';

const app = Router();

const JWT_SECRET = process.env.JWT_SECRET as string;

// api qui verifie si l'utilisateur existe dans la bdd via sont mail unique
app.post('/api/connexion', authLimiter, async (req, res) => {
    try {
        const { email, password } = LoginFormSchema.parse(req.body);
        const user = await getMail(email);

        if (!user) {
            return res.status(401).send("Email ou MDP incorrect");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '365d' }
            );

            res.json({
                token,
                id: user.id,
                prenom: user.prenom,
                email: user.email
            });
        } else {
            res.status(401).send("Email ou MDP incorrect");
        }
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
});

// api qui ajoute un utilisateur
app.post('/api/inscription', authLimiter, async (req, res) => {
    try {
        const donneesValides = InscriptionFormSchema.parse(req.body);
        const user = await ajouterUtilisateur(donneesValides);
        res.send(user);
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
});

export default app;