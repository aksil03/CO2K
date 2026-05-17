import { db } from "../db";
import type { Aliment } from '../types';

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