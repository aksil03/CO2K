import { Router } from 'express';
import { db } from "@/lib/db";
import { authentifierToken } from '@/middlewares/auth';
import { CreateProgrammeSchema } from '@/lib/types';
import { creerProgrammeComplet, getProgrammesUtilisateur, majInfosProgramme, supprimerProgramme } from '@/lib/queries/programmes.queries';

const app = Router();

// recupérer les programmes
app.get('/api/programmes/:userId', authentifierToken, async (req, res) => {
    const userId = Number(req.params.userId);
    try {
        const programmes = await getProgrammesUtilisateur(userId);
        res.json(programmes);
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération des programmes");
    }
});

// creer programme
app.post('/api/programmes/creer', authentifierToken, async (req, res) => {
    try {
        const validData = CreateProgrammeSchema.parse(req.body);
        const userId = validData.auteurId || (req as any).user.id;
        const count = await db.programme.count({ where: { auteurId: userId } });
        if (count >= 10) {
            return res.status(403).send("Limite de 10 programmes atteinte. Supprimez-en un pour continuer");
        }
        const resultat = await creerProgrammeComplet(validData);
        res.json(resultat);
    } catch (error) {
        res.status(500).send("Erreur lors de la création du programme");
    }
});

// supp programme
app.delete('/api/programmes/:id', authentifierToken, async (req, res) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    try {
        const programme = await db.programme.findUnique({ where: { id } });
        if (!programme || programme.auteurId !== userId) {
            return res.status(403).send("Non autorisé");
        }
        await supprimerProgramme(id);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression du programme");
    }
});


// Mettre a jour le planning d'une semaine dans un programme
app.patch('/api/programmes/semaine/:id', authentifierToken, async (req, res) => {
    const id = Number(req.params.id);

    try {
        const { planningId } = req.body;
        const pId = (planningId === 0 || planningId === null) ? null : Number(planningId);

        const semaine = await db.calendrierPlanning.findUnique({ where: { id } });
        if (semaine) {
            await db.post.deleteMany({
                where: { programmeId: semaine.programmeId }
            });
        }

        const semaineUpdate = await db.calendrierPlanning.update({
            where: { id: id },
            data: {
                planningId: pId
            },
            include: {
                planning: true
            }
        });
        res.json(semaineUpdate);
    } catch (error) {
        res.status(500).send("Erreur serveur lors de la mise à jour de la semaine");
    }
});

app.patch('/api/programmes/:id', authentifierToken, async (req, res) => {
    const id = Number(req.params.id);
    try {
        const data = req.body;
        await db.post.deleteMany({
            where: { programmeId: id }
        });
        const programmeMisAJour = await majInfosProgramme(id, data);
        res.json(programmeMisAJour);
    } catch (error) {
        res.status(500).send("Erreur lors de la mise à jour du programme");
    }
});

export default app;