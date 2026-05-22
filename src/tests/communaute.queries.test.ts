import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { db } from '../lib/db';
import * as queries from '../lib/queries/index';

jest.mock('../lib/db', () => ({
    __esModule: true,
    db: mockDeep<PrismaClient>(),
}));

const dbMock = db as any;

describe('Tests unitaires communaute', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // test creerPost
    it('creerPost', async () => {
        const postInput = {
            titre: 'Repas de muscu',
            contenu: 'Lightweight baby',
            auteurId: 1,
            programmeId: null,
            planningId: 5
        };

        dbMock.post.create.mockResolvedValue({ id: 500, ...postInput });
        const result = await queries.creerPost(postInput as any);
        expect(result.id).toBe(500);
        expect(dbMock.post.create).toHaveBeenCalledWith({
            data: {
                titre: postInput.titre,
                contenu: postInput.contenu,
                auteurId: postInput.auteurId,
                programmeId: null,
                planningId: 5
            },
            include: {
                auteur: true,
                programme: true,
                planning: true
            }
        });
    });

    // test getFeedCommunaute
    it('getFeedCommunaute', async () => {
        const userId = 1;
        dbMock.post.findMany.mockResolvedValue([]);

        await queries.getFeedCommunaute(userId);

        expect(dbMock.post.findMany).toHaveBeenCalledWith({
            where: {
                NOT: { auteurId: userId }
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
    });

    // test supprimerPost
    it('supprimerPost', async () => {
        const idPost = 500;
        dbMock.post.delete.mockResolvedValue({ id: idPost });
        await queries.supprimerPost(idPost);
        expect(dbMock.post.delete).toHaveBeenCalledWith({
            where: { id: idPost }
        });
    });

    // test getPostsByUserId
    it('getPostsByUserId', async () => {
        const userId = 1;
        dbMock.post.findMany.mockResolvedValue([]);
        await queries.getPostsByUserId(userId);
        expect(dbMock.post.findMany).toHaveBeenCalledWith({
            where: { auteurId: userId },
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
                    where: { userId: userId }
                },
                commentaires: {
                    include: {
                        auteur: { select: { prenom: true, nom: true } }
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
        });
    });

    // test toggleLike ajout like
    it('toggleLike - ajout', async () => {
        const postId = 10;
        const userId = 1;
        dbMock.like.findUnique.mockResolvedValue(null);
        dbMock.like.create.mockResolvedValue({ postId, userId });

        dbMock.like.count.mockResolvedValue(1);

        const result = await queries.toggleLike(postId, userId);

        expect(result).toBe(1);
        expect(dbMock.like.create).toHaveBeenCalled();
        expect(dbMock.like.count).toHaveBeenCalledWith({
            where: { postId: postId }
        });
    });

    // test toggleLike supp like
    it('toggleLike - suppression', async () => {
        const postId = 10;
        const userId = 1;

        dbMock.like.findUnique.mockResolvedValue({ postId, userId });
        dbMock.like.delete.mockResolvedValue({ postId, userId });

        dbMock.like.count.mockResolvedValue(0);

        const result = await queries.toggleLike(postId, userId);

        expect(result).toBe(0);
        expect(dbMock.like.delete).toHaveBeenCalled();
        expect(dbMock.like.count).toHaveBeenCalledWith({
            where: { postId: postId }
        });
    });

    // test toggleFollow follow
    it('toggleFollow - abonnement', async () => {
        const abonneId = 1;
        const starId = 2;

        dbMock.follow.findUnique.mockResolvedValue(null);
        dbMock.follow.create.mockResolvedValue({ id_abonne: abonneId, id_star: starId });
        const result = await queries.toggleFollow(abonneId, starId);

        expect(result).toBe(true);
        expect(dbMock.follow.create).toHaveBeenCalledWith({
            data: { id_abonne: abonneId, id_star: starId }
        });
    });

    // test toggleFollow unfollow
    it('toggleFollow - désabonnement', async () => {
        const abonneId = 1;
        const starId = 2;

        dbMock.follow.findUnique.mockResolvedValue({ id_abonne: abonneId, id_star: starId });
        dbMock.follow.delete.mockResolvedValue({ id_abonne: abonneId, id_star: starId });

        const result = await queries.toggleFollow(abonneId, starId);

        expect(result).toBe(false);
        expect(dbMock.follow.delete).toHaveBeenCalledWith({
            where: {
                id_abonne_id_star: { id_abonne: abonneId, id_star: starId }
            }
        });
    });

    // test ajouterCommentaire
    it('ajouterCommentaire', async () => {
        const auteurId = 1;
        const postId = 10;
        const texte = 'Lightweight baby!';
        const parentId = 5;

        dbMock.commentaire.create.mockResolvedValue({
            id: 100,
            texte,
            auteur: { prenom: 'ronnie', nom: 'colman' }
        });

        const result = await queries.ajouterCommentaire(postId, auteurId, texte, parentId);

        expect(result.id).toBe(100);
        expect(result.texte).toBe(texte);
        expect(result.auteur.prenom).toBe('ronnie');

        expect(dbMock.commentaire.create).toHaveBeenCalledWith({
            data: {
                postId: postId,
                auteurId: auteurId,
                texte: texte,
                parentId: parentId
            },
            include: {
                auteur: {
                    select: { prenom: true, nom: true }
                }
            }
        });
    });
});
