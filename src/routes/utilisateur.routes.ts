import { Router } from 'express';
import { db } from "@/lib/db";
import { authentifierToken } from '@/middlewares/auth';
import { CreateProgrammeSchema, ProfilFormSchema } from '@/lib/types';
import { getUtilisateurComplet, majProfil } from '@/lib/queries/utilisateur.queries';

const app = Router();

// get l'utilisateur avec ses relations
app.get('/api/utilisateur', authentifierToken, async (req, res) => {
    const email = req.query.email as string;

    try {
        const resultat = await getUtilisateurComplet(email);
        if (resultat !== null) {
            res.send(resultat);
        }
        else {
            res.status(404).send("Utilisateur non trouvé");
        }
    } catch (erreur) {
        res.status(500).send("Erreur du serveur");
    }
});

// maj profil
app.put('/api/utilisateur/update/:email', authentifierToken, async (req, res) => {
    const email = req.params.email;
    const tokenEmail = (req as any).user.email;
    if (email !== tokenEmail) {
        return res.status(403).send("Non autorisé");
    }
    try {
        const nouvellesDonnees = ProfilFormSchema.parse(req.body);
        const misAjour = await majProfil(email, nouvellesDonnees);
        res.send(misAjour);
    } catch (erreur) {
        res.status(500).send("Erreur pendant la mise à jour");
    }
});

export default app;