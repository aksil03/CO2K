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
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
    console.log("Connexion SQLite réussie !");


    

    app.listen(3000, () => {
      console.log("Serveur démarré sur le port 3000");
    });
  } catch (err) {
    console.error("Erreur fatale :", err);
  }
}

startServer();

