import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.routes';
import utilisateurRoutes from './src/routes/utilisateur.routes';
import alimentsRoutes from './src/routes/aliments.routes';
import planningRoutes from './src/routes/planning.routes';
import programmesRoutes from './src/routes/programmes.routes';
import communauteRoutes from './src/routes/communaute.routes';


const app = express();

const CORS = process.env.CORS;
if (!CORS) throw new Error("CORS introuvable");
app.use(cors({ origin: CORS }));

app.use(express.json());

app.use(authRoutes);
app.use(utilisateurRoutes);
app.use(alimentsRoutes);
app.use(planningRoutes);
app.use(programmesRoutes);
app.use(communauteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});


