import { db } from "../db";
import type { InscriptionData, ProfilData } from "../types";
import * as bcrypt from 'bcrypt';

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
            plannings: {
                include: {
                    posts: true,
                    calendriers: {
                        include: {
                            programme: {
                                include: {
                                    posts: true
                                }
                            }
                        }
                    },
                    repas: {
                        include: {
                            portions: {
                                include: {
                                    aliment: true
                                }
                            }
                        }
                    }
                }
            },
            programmes: {
                include: {
                    posts: true,
                    semaines: {
                        include: {
                            planning: {
                                include: {
                                    repas: {
                                        include: {
                                            portions: {
                                                include: { aliment: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            repas: true,
            mesAbonnements: true,
            posts: {
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
                    likes: true,
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
                        select: { likes: true, commentaires: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: {
                    mesAbonnes: true,
                    mesAbonnements: true,
                    programmes: true,
                    plannings: true
                }
            }
        }
    });
};


// creer un user dans la bdd
export const ajouterUtilisateur = async (userData: InscriptionData) => {

    const comp = 15;
    const hashedPassword = await bcrypt.hash(userData.password, comp);

    return await db.utilisateur.create({
        data: {
            ...userData,
            password: hashedPassword
        }
    });
};


// Maj profil
export const majProfil = async (email: string, data: ProfilData) => {
    return await db.utilisateur.update({
        where: { email },
        data: data
    });
};