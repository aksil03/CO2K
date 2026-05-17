import { db } from "../db";

// Récupère tous les programmes d'un utilisateur
export const getProgrammesUtilisateur = async (userId: number) => {
    return await db.programme.findMany({
        where: { auteurId: userId },
        include: {
            posts: true,
            semaines: {
                include: {
                    planning: {
                        include: {
                            repas: {
                                include: { portions: { include: { aliment: true } } }
                            }
                        }
                    }
                },
                orderBy: { ordre: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const creerProgrammeComplet = async (data: {
    nom: string,
    description?: string,
    auteurId: number,
    semaines: { planningId: number | null, semaineDebut: Date, ordre: number }[]
}) => {
    return await db.programme.create({
        data: {
            nom: data.nom,
            description: data.description,
            auteurId: data.auteurId,
            semaines: {
                create: data.semaines.map(s => ({
                    semaineDebut: s.semaineDebut,
                    ordre: s.ordre,
                    planningId: (s.planningId && s.planningId !== 0) ? s.planningId : null
                }))
            }
        },
        include: {
            semaines: {
                include: { planning: true }
            }
        }
    });
};

export const supprimerProgramme = async (id: number) => {
    return await db.programme.delete({
        where: { id }
    });
};

export const viderTousLesProgrammes = async (userId: number) => {
    return await db.programme.deleteMany({
        where: { auteurId: userId }
    });
};

export const majInfosProgramme = async (id: number, data: { nom?: string, description?: string }) => {
    return await db.programme.update({
        where: { id },
        data: data,
        include: {
            posts: true,
            semaines: {
                include: {
                    planning: true
                }
            }
        }
    });
};