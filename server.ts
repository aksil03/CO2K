import express, { Request, Response } from 'express';
import cors from 'cors';
import { db } from './src/lib/db.ts';
import { getMail } from './src/lib/queries.ts';
import { ajouterUtilisateur } from './src/lib/queries.ts';

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


    app.listen(3000, () => {
      console.log("Serveur démarré sur le port 3000");
    });
