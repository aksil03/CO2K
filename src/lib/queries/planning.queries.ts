import { heureRepas } from "../constants-logic";
import { db } from "../db";

// sauvegarde un planning
export const sauvegarderPlanning = async (params: any) => {
    const { auteurId, nom, repas } = params;
    return await db.$transaction(async (tx) => {

        const nouveauPlanning = await tx.planning.create({
            data: {
                nom: nom,
                auteurId: auteurId,
            }
        });

        if (repas && repas.length > 0) {
            for (const unRepas of repas) {
                const d = new Date();
                d.setDate(d.getDate() + ((unRepas.numJour || 1) - 1));
                const heureKey = (unRepas.moment || unRepas.type) as keyof typeof heureRepas;
                const heure = heureRepas[heureKey] || 12;
                d.setHours(heure, 0, 0, 0);

                await tx.repas.create({
                    data: {
                        dateConsom: d,
                        type: unRepas.moment || unRepas.type || "DEJEUNER",
                        nomTemplate: unRepas.template || "HOT",
                        utilisateurId: auteurId,
                        numJour: unRepas.numJour || 1,
                        planningId: nouveauPlanning.id,

                        portions: {
                            create: (unRepas.aliments || []).map((al: any) => ({
                                quantite: al.poids,
                                alimentId: al.aliment.id,
                            }))
                        }
                    }
                });
            }
        }

        return await tx.planning.findUnique({
            where: { id: nouveauPlanning.id },
            include: {
                repas: {
                    include: {
                        portions: {
                            include: { aliment: true }
                        }
                    }
                }
            }
        });
    }, {
        timeout: 60000
    });
};

// Récupérer tous les plannings d'un user
export const getPlanningsUtilisateur = async (userId: number) => {
    return await db.planning.findMany({
        where: { auteurId: userId },
        include: {
            repas: {
                include: {
                    portions: {
                        include: {
                            aliment: true
                        }
                    }
                },
                orderBy: { dateConsom: 'asc' }
            },
            posts: true,
            calendriers: {
                include: {
                    programme: {
                        include: {
                            posts: true
                        }
                    }
                }
            }
        },
        orderBy: { id: 'desc' }
    });
};

// Supprimer un planning 
export const supprimerPlanning = async (id: number) => {
    return await db.$transaction(async (tx) => {
        await tx.post.deleteMany({
            where: { planningId: id }
        });

        const semainesImpactees = await tx.calendrierPlanning.findMany({
            where: { planningId: id },
            select: { programmeId: true }
        });

        const idsProgrammes = semainesImpactees.map(s => s.programmeId);

        if (idsProgrammes.length > 0) {
            await tx.post.deleteMany({
                where: { programmeId: { in: idsProgrammes } }
            });
        }

        await tx.calendrierPlanning.updateMany({
            where: { planningId: id },
            data: { planningId: null }
        });

        return await tx.planning.delete({
            where: { id }
        });
    }, {
        timeout: 60000
    });
};

// Met à jour un planning 
export const majPlanning = async (repas: any[]) => {
    return await db.$transaction(async (tx) => {
        const requetes = repas.flatMap((unRepas) =>
            unRepas.portions.map((portion: any) =>
                tx.portion.update({
                    where: { id: portion.id },
                    data: {
                        quantite: portion.quantite,
                        alimentId: portion.aliment.id,
                    },
                })
            )
        );
        return await Promise.all(requetes);
    }, {
        timeout: 600000
    });
};

// mise à jour légère des infos du planning
export const majInfosPlanning = async (id: number, data: { nom?: string, description?: string }) => {
    return await db.planning.update({
        where: { id },
        data: data
    });
};