import { db } from "../db";
import type { CreatePostData } from "../types";

// Créer un nouveau post
export const creerPost = async (data: CreatePostData) => {
    return await db.post.create({
        data: {
            titre: data.titre,
            contenu: data.contenu,
            auteurId: data.auteurId,
            programmeId: data.programmeId ?? null,
            planningId: data.planningId ?? null,
            repasId: data.repasId ?? null,
        },
        include: {
            auteur: true,
            programme: true,
            planning: true
        }
    });
};

// Récupére tout les post de tout le monde
export const getFeedCommunaute = async (userId?: number) => {
    return await db.post.findMany({
        where: {
            NOT: {
                auteurId: userId
            }
        },
        include: {
            auteur: {
                select: {
                    prenom: true,
                    nom: true,
                    email: true,
                    poids: true,
                    taille: true,
                    age: true,
                    genre: true,
                    activite: true,
                    objectif: true
                }
            },
            likes: {
                where: {
                    userId: userId
                }
            },
            commentaires: {
                include: {
                    auteur: {
                        select: { prenom: true, nom: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            programme: {
                include: {
                    semaines: {
                        include: {
                            planning: {
                                include: {
                                    repas: {
                                        include: {
                                            portions: { include: { aliment: true } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            planning: {
                include: {
                    repas: {
                        include: {
                            portions: { include: { aliment: true } }
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true,
                    commentaires: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

// Supprimer un post
export const supprimerPost = async (id: number) => {
    return await db.post.delete({
        where: { id }
    });
};

// Récupére les post d'un user
export const getPostsByUserId = async (userId: number) => {
    return await db.post.findMany({
        where: {
            auteurId: userId,
        },
        include: {
            auteur: {
                select: {
                    prenom: true,
                    nom: true,
                    email: true,
                    poids: true,
                    taille: true,
                    age: true,
                    genre: true,
                    activite: true,
                    objectif: true
                }
            },
            likes: {
                where: {
                    userId: userId
                }
            },
            commentaires: {
                include: {
                    auteur: {
                        select: { prenom: true, nom: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            programme: {
                include: {
                    semaines: {
                        include: {
                            planning: {
                                include: {
                                    repas: {
                                        include: { portions: { include: { aliment: true } } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            planning: {
                include: {
                    repas: {
                        include: { portions: { include: { aliment: true } } }
                    }
                }
            },
            _count: {
                select: { likes: true, commentaires: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};


// gere les likes des postes
export const toggleLike = async (postId: number, userId: number) => {
    const existingLike = await db.like.findUnique({
        where: {
            postId_userId: {
                postId: postId,
                userId: userId,
            },
        },
    });

    if (existingLike) {
        await db.like.delete({
            where: {
                postId_userId: {
                    postId: postId,
                    userId: userId,
                },
            },
        });
    } else {
        await db.like.create({
            data: {
                postId: postId,
                userId: userId,
            },
        });
    }

    const totalGlobal = await db.like.count({
        where: {
            postId: postId
        }
    });

    return totalGlobal;
};


export const toggleFollow = async (abonneId: number, starId: number) => {
    const existingFollow = await db.follow.findUnique({
        where: {
            id_abonne_id_star: {
                id_abonne: abonneId,
                id_star: starId,
            },
        },
    });

    if (existingFollow) {
        await db.follow.delete({
            where: {
                id_abonne_id_star: {
                    id_abonne: abonneId,
                    id_star: starId,
                },
            },
        });
        return false;
    } else {
        await db.follow.create({
            data: {
                id_abonne: abonneId,
                id_star: starId,
            },
        });
        return true;
    }
};

export const ajouterCommentaire = async (postId: number, auteurId: number, texte: string, parentId?: number) => {
    return await db.commentaire.create({
        data: {
            postId,
            auteurId,
            texte,
            parentId: parentId || null
        },
        include: {
            auteur: {
                select: {
                    prenom: true,
                    nom: true
                }
            }
        }
    });
};

// supp un commentaire
export const supprimerCommentaire = async (id: number, auteurId: number) => {
    return await db.commentaire.delete({
        where: {
            id: id,
            auteurId: auteurId
        }
    });
};
