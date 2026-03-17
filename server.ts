import express, { Request, Response } from 'express';
import cors from 'cors';
import { db } from './src/lib/db.ts';
import { getMail, getUtilisateurComplet } from './src/lib/queries.ts';
import { ajouterUtilisateur, majProfil } from './src/lib/queries.ts';

const app = express();

app.use(cors());
app.use(express.json());

// api qui verifie si l'utilisateur existe dans la bdd via sont mail unique
app.post('/api/connexion', async (req, res) => {
  const { email, password } = req.body;

  try {
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
    const user = await ajouterUtilisateur(req.body);
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
  const nouvellesDonnees = req.body;
  try {
    const misAjour = await majProfil(email, nouvellesDonnees);
    res.send(misAjour);
  } catch (erreur) {
    res.status(500).send("Erreur pendant la mise à jour");
  }
});

app.listen(3000, () => {
  console.log("Serveur démarré sur le port 3000");
});
