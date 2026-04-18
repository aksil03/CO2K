import express, { Request, Response } from 'express';
import cors from 'cors';
import { db } from './src/lib/db.ts';
import { 
  getMail, getUtilisateurComplet, sauvegarderPlanning, majPlanning, getProgrammesUtilisateur,
  ajouterUtilisateur, majProfil, majInfosPlanning, creerProgrammeComplet, majInfosProgramme,
  getAlimentsParBac, getAllAliments, getPlanningsUtilisateur, supprimerPlanning, supprimerProgramme
} from './src/lib/queries.ts';
import { AlimentsGroupes, CreateProgrammeSchema } from './src/lib/types';
import { AssignerPlanningSchema } from './src/lib/types';
import { InscriptionFormSchema, SavePlanningSchema, LoginFormSchema, ProfilFormSchema } from './src/lib/types';

const app = express();

app.use(cors());
app.use(express.json());

// api qui verifie si l'utilisateur existe dans la bdd via sont mail unique
app.post('/api/connexion', async (req, res) => {
  try {
    const { email, password } = LoginFormSchema.parse(req.body);
    const user = await getMail(email);

    if (user && user.password === password) {
      res.send(user); 
    } else {
      res.status(401).send("Email ou MDP incorrect");
    }
  } catch (error) {
      res.status(500).send("Erreur serveur");
  }
});

// api qui ajoute un utilisateur
app.post('/api/inscription', async (req, res) => {
  try {
    const donneesValides = InscriptionFormSchema.parse(req.body);
    const user = await ajouterUtilisateur(donneesValides);
    res.send(user); 
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});


// get l'utilisateur avec ses relations
app.get('/api/utilisateur', async (req, res) => {
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
app.put('/api/utilisateur/update/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const nouvellesDonnees = ProfilFormSchema.parse(req.body);
    const misAjour = await majProfil(email, nouvellesDonnees);
    res.send(misAjour);
  } catch (erreur) {
    res.status(500).send("Erreur pendant la mise à jour");
  }
});

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

// sauvegarde un planning
app.post('/api/planning/sauvegarder', async (req, res) => {
  try {
    const planningValide = SavePlanningSchema.parse(req.body);
    const planning = await sauvegarderPlanning(planningValide);
    res.status(201).json(planning); 
  } catch (error) {
    res.status(500).send("Erreur lors de la sauvegarde");
  }
});

// Récupérer la liste de tous les plannings d'un utilisateur
app.get('/api/planning/liste', async (req, res) => {
  const userId = Number(req.query.userId);

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
app.delete('/api/planning/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await supprimerPlanning(id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression");
  }
});

// Mise à jour planning
app.post('/api/planning/update', async (req, res) => {
  const { repas } = req.body;
  try {
    const resultat = await majPlanning(repas);
    res.send(resultat);
  } catch (error) {
    res.status(500).send("Erreur lors de la mise à jour du planning");
  }
});

// Mise à jour des informations de base du planning 
app.patch('/api/planning/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = SavePlanningSchema.partial().parse(req.body); 
    const planningMisAJour = await majInfosPlanning(id, data);
    res.json(planningMisAJour);
  } catch (error) {
    res.status(500).send("Erreur lors de la modification");
  }
});

// recupérer les programmes
app.get('/api/programmes/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  try {
    const programmes = await getProgrammesUtilisateur(userId);
    res.json(programmes);
  } catch (error) {
    res.status(500).send("Erreur lors de la récupération des programmes");
  }
});

// creer programme
app.post('/api/programmes/creer', async (req, res) => {
  try {
    const validData = CreateProgrammeSchema.parse(req.body);
    const resultat = await creerProgrammeComplet(validData);
    res.json(resultat);
  } catch (error) {
    res.status(500).send("Erreur lors de la création du programme");
  }
});

// supp programme
app.delete('/api/programmes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await supprimerProgramme(id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression du programme");
  }
});

// Mettre a jour le planning d'une semaine dans un programme
app.patch('/api/programmes/semaine/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  try {
    const { planningId } = req.body;
    const pId = (planningId === 0 || planningId === null) ? null : Number(planningId);

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

app.patch('/api/programmes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = req.body; 
    const programmeMisAJour = await majInfosProgramme(id, data);
    res.json(programmeMisAJour);
  } catch (error) {
    res.status(500).send("Erreur lors de la mise à jour du programme");
  }
});

app.listen(3000, () => {
  console.log("Serveur démarré sur le port 3000");
});



