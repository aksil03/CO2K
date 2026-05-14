import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { db } from './src/lib/db.ts';
import bcrypt from 'bcrypt';

import {
  getMail, getUtilisateurComplet, sauvegarderPlanning, majPlanning, getProgrammesUtilisateur,
  ajouterUtilisateur, majProfil, majInfosPlanning, creerProgrammeComplet, majInfosProgramme,
  getAlimentsParBac, getAllAliments, getPlanningsUtilisateur, supprimerPlanning, supprimerProgramme,
  creerPost, getFeedCommunaute, getPostsByUserId, toggleLike, toggleFollow, ajouterCommentaire,
  supprimerPost,
  supprimerCommentaire
} from './src/lib/queries.ts';
import { AlimentsGroupes, CreateProgrammeSchema, CreatePostSchema } from './src/lib/types';
import { AssignerPlanningSchema } from './src/lib/types';
import { InscriptionFormSchema, SavePlanningSchema, LoginFormSchema, ProfilFormSchema } from './src/lib/types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("secret introuvable");
const app = express();

app.use(cors());
app.use(express.json());

const authentifierToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send("Token manquant");

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).send("Session expirée ou token invalide");
    req.user = user;
    next();
  });
};

// api qui verifie si l'utilisateur existe dans la bdd via sont mail unique
app.post('/api/connexion', async (req, res) => {
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
        { expiresIn: '2h' }
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
app.post('/api/planning/sauvegarder', authentifierToken, async (req, res) => {
  try {
    const planningValide = SavePlanningSchema.parse(req.body);
    const planning = await sauvegarderPlanning(planningValide);
    res.status(201).json(planning);
  } catch (error) {
    res.status(500).send("Erreur lors de la sauvegarde");
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
  try {
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
    const resultat = await creerProgrammeComplet(validData);
    res.json(resultat);
  } catch (error) {
    res.status(500).send("Erreur lors de la création du programme");
  }
});

// supp programme
app.delete('/api/programmes/:id', authentifierToken, async (req, res) => {
  const id = Number(req.params.id);
  try {
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
    const programmeMisAJour = await majInfosProgramme(id, data);
    res.json(programmeMisAJour);
  } catch (error) {
    res.status(500).send("Erreur lors de la mise à jour du programme");
  }
});

// créer un post
app.post('/api/posts/creer', authentifierToken, async (req, res) => {
  try {
    const validData = CreatePostSchema.parse(req.body);
    const post = await creerPost(validData);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).send("Erreur lors de la publication");
  }
});

// récupère le feed
app.get('/api/communaute/feed', authentifierToken, async (req, res) => {
  const monId = (req as any).user.id;
  try {
    const feed = await getFeedCommunaute(monId);
    res.json(feed);
  } catch (error) {
    res.status(500).send("Erreur lors de la récupération du feed");
  }
});


app.get('/api/posts/utilisateur/:id', authentifierToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const posts = await getPostsByUserId(userId);
    res.json(posts);
  } catch (error) {
    res.status(500).send("Erreur lors de la récupération de tes posts");
  }
});

app.post('/api/posts/:id/like', authentifierToken, async (req, res) => {
  const postId = Number(req.params.id);
  const { userId } = req.body;
  try {
    const totalLikes = await toggleLike(postId, userId);
    res.json({ likesCount: totalLikes });
  } catch (error) {
    res.status(500).send("Erreur lors du like");
  }
});

app.get('/api/follow/status', authentifierToken, async (req, res) => {
  const { abonneId, starId } = req.query;
  const follow = await db.follow.findUnique({
    where: { id_abonne_id_star: { id_abonne: Number(abonneId), id_star: Number(starId) } }
  });
  res.json({ isFollowing: !!follow });
});

app.post('/api/follow/toggle', authentifierToken, async (req, res) => {
  const { abonneId, starId } = req.body;
  const result = await toggleFollow(Number(abonneId), Number(starId));
  res.json({ isFollowing: result });
});

app.post('/api/posts/:id/commentaires', authentifierToken, async (req, res) => {
  const postId = Number(req.params.id);
  const { auteurId, texte, parentId } = req.body;

  try {
    if (!texte || texte.trim() === "") {
      return res.status(400).send("Le texte du commentaire est vide");
    }

    const commentaire = await ajouterCommentaire(postId, Number(auteurId), texte, parentId ? Number(parentId) : undefined);
    res.status(201).json(commentaire);
  } catch (error) {
    res.status(500).send("Erreur lors de l'ajout du commentaire");
  }
});

// Supprimer un post
app.delete('/api/posts/:id', authentifierToken, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await supprimerPost(id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression du post");
  }
});

app.delete('/api/commentaires/:id', authentifierToken, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const auteurId = req.user.id;
    await supprimerCommentaire(id, auteurId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression du commentaire");
  }
});


app.listen(3000, () => {
  console.log("Serveur démarré sur le port 3000");
});



