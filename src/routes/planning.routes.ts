import { Router } from 'express';
import { db } from "@/lib/db";
import { authentifierToken } from '@/middlewares/auth';
import { SavePlanningSchema } from '@/lib/types';
import { getPlanningsUtilisateur, majInfosPlanning, majPlanning, sauvegarderPlanning, supprimerPlanning } from '@/lib/queries/planning.queries';

const app = Router();

// sauvegarde un planning
app.post('/api/planning/sauvegarder', authentifierToken, async (req, res) => {
    try {
        const planningValide = SavePlanningSchema.parse(req.body);
        const userId = (req as any).user.id || planningValide.auteurId;
        const count = await db.planning.count({ where: { auteurId: userId } });
        if (count >= 10) {
            return res.status(403).send("Limite de 10 plannings atteinte. Supprimez-en un pour continuer");
        }
        const planning = await sauvegarderPlanning(planningValide);
        res.status(201).json(planning);
    } catch (error) {
        console.error("Erreur lors de la sauvegarde du planning:", error);
        res.status(500).send(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    }
});

// Récupérer la liste de tous les plannings d'un utilisateur
app.get('/api/planning/liste', authentifierToken, async (req, res) => {
    const userId = (req as any).user.id;

    if (!userId) {
        return res.status(400).send("ID utilisateur manquant");
    }

    try {
        const plannings = await getPlanningsUtilisateur(userId);
        res.json(plannings);
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération des plannings");
    }
});

// Supprimer un planning 
app.delete('/api/planning/:id', authentifierToken, async (req, res) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    try {
        const planning = await db.planning.findUnique({ where: { id } });
        if (!planning || planning.auteurId !== userId) {
            return res.status(403).send("Non autorisé");
        }
        await supprimerPlanning(id);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression");
    }
});


// Mise à jour planning
app.post('/api/planning/update', authentifierToken, async (req, res) => {
    const { repas } = req.body;
    try {
        const resultat = await majPlanning(repas);
        res.send(resultat);
    } catch (error) {
        res.status(500).send("Erreur lors de la mise à jour du planning");
    }
});

// Mise à jour des informations de base du planning 
app.patch('/api/planning/:id', authentifierToken, async (req, res) => {
    const id = Number(req.params.id);
    try {
        const data = SavePlanningSchema.partial().parse(req.body);
        const planningMisAJour = await majInfosPlanning(id, data);
        res.json(planningMisAJour);
    } catch (error) {
        res.status(500).send("Erreur lors de la modification");
    }
});

export default app;