import { db } from './db.ts';
import type { InscriptionData } from './types.ts'; 

export const getMail = async (email: string) => {
  return await db.utilisateur.findUnique({
    where: { email }
  });
};

export const ajouterUtilisateur = async (userData: InscriptionData) => {
  return await db.utilisateur.create({
    data: userData
  });
};