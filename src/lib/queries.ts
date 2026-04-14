import { db } from './db.ts';
import type { InscriptionData } from './types.ts'; 
import type { ProfilData } from './types';
import type { Aliment } from './types.ts';
import type { SavePlanningData, JourneePlanning, RepasGenere, PanierItem } from './types.ts';

// recupere l'utilisateur via sont mail
export const getMail = async (email: string) => {
  return await db.utilisateur.findUnique({
    where: { email }
  });
};

// recupere l'utilisateur via le mail et toutes ses relations
export const getUtilisateurComplet = async (email: string) => {
  return await db.utilisateur.findUnique({
    where: { email },
    include: {
      repas: true,
      badges: { include: { badge: true } },
      plannings: true,
      _count: {
        select: {
          mesAbonnes: true,
          mesAbonnements: true
        }
      }
    }
  });
};

// creer un user dans la bdd
export const ajouterUtilisateur = async (userData: InscriptionData) => {
  return await db.utilisateur.create({
    data: userData
  });
};


// Maj profil
export const majProfil = async (email: string, data: ProfilData) => {
  return await db.utilisateur.update({
    where: { email },
    data: data 
  });
};

// Recupere tout les aliments par bacs
export const getAlimentsParBac = async (bac: string) => {
  return await db.aliment.findMany({
    where: { bac: bac as any },
    orderBy: { nom: 'asc' }
  });
};

// Recupere un aliment par ID
export const getAlimentById = async (id: number) => {
  return await db.aliment.findUnique({
    where: { id }
  });
};

// recupere tout les aliments
export const getAllAliments = async (): Promise<Aliment[]> => {
  return await db.aliment.findMany({
    orderBy: { nom: 'asc' }
  });
};

// Sauvegarder un planning
export const sauvegarderPlanning = async (params: SavePlanningData) => {
  const { utilisateurId, nom, journal } = params;

  return await db.planning.create({
    data: {
      nom: nom,
      auteurId: utilisateurId,
      repas: {
        create: journal.flatMap((unJour: JourneePlanning, index: number) => {
          const dateCible = new Date();
          dateCible.setDate(dateCible.getDate() + index);

          return unJour.repas.map((unRepas: RepasGenere) => ({
            dateConsom: dateCible,
            type: unRepas.moment,
            nomTemplate: unRepas.template || "HOT",
            utilisateurId: utilisateurId,
            portions: {
              create: unRepas.aliments.map((al: PanierItem) => ({
                quantite: al.poids,
                alimentId: al.aliment.id,
              }))
            }
          }));
        })
      }
    }
  });
};