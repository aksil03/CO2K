import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { open } from 'sqlite';

const app = express();
app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    const db = await open({
      filename: './bdd/database.sqlite',
      driver: sqlite3.Database
    });
    console.log("Connexion SQLite réussie !");

    await db.run(`
      INSERT OR IGNORE INTO utilisateurs (nom, prenom, email, password) 
      VALUES ('Bounif', 'Aksil', 'Aksil', 'Aksil')
    `);

     app.post('/api/connexion', async (req, res) => {
      const { email, password } = req.body;

      const user = await db.get(
        'SELECT * FROM utilisateurs WHERE email = ? AND password = ?',
        [email, password]
      );

      if (user) {
          res.send(user);
      } 
      else {
       res.status(401).send(); 
      }
    });

    
    

    app.listen(3000, () => {
      console.log("Serveur démarré sur le port 3000");
    });
  } catch (err) {
    console.error("Erreur fatale :", err);
  }
}

startServer();

