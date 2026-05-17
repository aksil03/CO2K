import { Router } from 'express';
import { getAlimentsParBac, getAllAliments } from '../lib/queries/aliments.queries';
import type { AlimentsGroupes } from '../lib/types';

const app = Router();

// Route pour recuperer les aliments par bac
app.get('/api/aliments', async (req, res) => {
    const nomDuBac = req.query.bac as string;

    try {
        const resultats = await getAlimentsParBac(nomDuBac);

        res.json(resultats);
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération des aliments");
    }
});

// recupere le catalogue grouper par BAC
app.get('/api/aliments/all', async (req, res) => {
    try {
        const data = await getAllAliments();

        const catalogue: AlimentsGroupes = {};

        data.forEach((aliment) => {
            const nomBac = aliment.bac;

            if (!catalogue[nomBac]) {
                catalogue[nomBac] = [];
            }
            catalogue[nomBac]?.push(aliment);
        });

        res.json(catalogue);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default app;