import { heureRepas } from "../constants-logic";
import { db } from "../db";

// sauvegarde un planning
export const sauvegarderPlanning = async (params: any) => {
    const { auteurId, nom, repas } = params;

    return await db.planning.create({
        data: {
            nom: nom,
            auteurId: auteurId,
            repas: {
                create: repas.map((unRepas: any) => ({
                    dateConsom: (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + (unRepas.numJour - 1));
                        const heure = heureRepas[unRepas.type as keyof typeof heureRepas] || 12;
                        d.setHours(heure, 0, 0, 0);
                        return d;
                    })(),
                    type: unRepas.moment,
                    nomTemplate: unRepas.template || "HOT",
                    utilisateurId: auteurId,
                    numJour: unRepas.numJour || 1,
                    portions: {
                        create: unRepas.aliments.map((al: any) => ({
                            quantite: al.poids,
                            alimentId: al.aliment.id,
                        }))
                    }
                }))
            }
        },
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
    });
};

// Met à jour un planning 
export const majPlanning = async (repas: any[]) => {
    return await db.$transaction(
        repas.flatMap((unRepas) =>
            unRepas.portions.map((portion: any) =>
                db.portion.update({
                    where: { id: portion.id },
                    data: {
                        quantite: portion.quantite,
                        alimentId: portion.aliment.id,
                    },
                })
            )
        )
    );
};

// mise à jour légère des infos du planning
export const majInfosPlanning = async (id: number, data: { nom?: string, description?: string }) => {
    return await db.planning.update({
        where: { id },
        data: data
    });
};