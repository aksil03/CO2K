import { db } from './db.ts';
import type { InscriptionData } from './types.ts'; 
import type { ProfilData } from './types';

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