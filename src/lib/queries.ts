import { db } from './db.ts';
import type { InscriptionData } from './types.ts'; 

// recupere l'utilisateur via le mail
export const getMail = async (email: string) => {
  return await db.utilisateur.findUnique({
    where: { email }
  });
};

// creer un user dans la bdd
export const ajouterUtilisateur = async (userData: InscriptionData) => {
  return await db.utilisateur.create({
    data: userData
  });
};