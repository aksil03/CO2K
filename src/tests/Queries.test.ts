import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { db } from '../lib/db'; 
import * as queries from '../lib/queries';

jest.mock('../lib/db', () => ({
  __esModule: true,
  db: mockDeep<PrismaClient>(),
}));

const dbMock = db as any;

describe('Tests unitaires', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test getMail
  it('getMail', async () => {
    const mockUser = { id: 1, email: 'test@gmail.com', nom: 'testeur' };
    dbMock.utilisateur.findUnique.mockResolvedValue(mockUser);
    const result = await queries.getMail('test@gmail.com');
    expect(result).toEqual(mockUser);
    expect(dbMock.utilisateur.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@gmail.com' }
    });
  });

  // test de cas limite
  it('getMail inexistant', async () => {
    dbMock.utilisateur.findUnique.mockResolvedValue(null);
    const result = await queries.getMail('fantome@gmail.com');
    
    expect(result).toBeNull(); 
  });



  // test getUtilisateurComplet
  it('getUtilisateurComplet', async () => {
    dbMock.utilisateur.findUnique.mockResolvedValue({ id: 1, email: 'test@gmail.com' });
    await queries.getUtilisateurComplet('test@gmail.com');

    expect(dbMock.utilisateur.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@gmail.com' },
      include: {
        repas: true,
        plannings: true,
        mesAbonnements: true,
        posts: true,
        programmes: { 
          include: { semaines: true }
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
  });

  // test ajouterUtilisateur
  it('ajouterUtilisateur', async () => {
    const inputData = { 
      nom: 'colman', 
      prenom: 'ronnie', 
      email: 'ronnie@gmail.com', 
      password: '12345',
      age: 25,
      poids: 65,
      taille: 165,
      genre: 'HOMME',           
      objectif: 'PERTE_DE_GRAS'
    };
    
    dbMock.utilisateur.create.mockResolvedValue({ 
      id: 2, 
      ...inputData, 
      createdAt: new Date() 
    });

    const result = await queries.ajouterUtilisateur(inputData as any);
    expect(result.id).toBe(2);
    expect(result.genre).toBe('HOMME');
    expect(dbMock.utilisateur.create).toHaveBeenCalledWith({
      data: inputData
    });
  });

  // Test d'exception sur bdd
  it('ajouterUtilisateur exception si bdd échoue', async () => {
    const errorData = { nom: 'Erreur' };
    dbMock.utilisateur.create.mockRejectedValue(new Error('Connexion perdue'));

    await expect(queries.ajouterUtilisateur(errorData as any))
      .rejects.toThrow('Connexion perdue');
  });

  // test majProfil
  it('majProfil', async () => {
    const emailCible = 'test@gmail.com';
    const updateData = { 
      poids: 75.5, 
      objectif: 'PRISE_DE_MASSE',
      activite: 'INTENSE' 
    };

    dbMock.utilisateur.update.mockResolvedValue({ 
      email: emailCible, 
      ...updateData,
      nom: 'colmane'
    } as any);

    const result = await queries.majProfil(emailCible, updateData as any);

    expect(result.poids).toBe(75.5);
    expect(result.objectif).toBe('PRISE_DE_MASSE');

    expect(dbMock.utilisateur.update).toHaveBeenCalledWith({
      where: { email: emailCible }, 
      data: updateData       
    });
  });

  // test parametré getAlimentsParBac
  it.each([
    ['PROT_VOLAILLE'],
    ['RIZ'],
    ['LEG']
  ])('getAlimentsParBac pour le bac %s', async (bac) => {
    const mockAliments = [{ id: 1, nom: 'Test', bac: bac }];
    dbMock.aliment.findMany.mockResolvedValue(mockAliments);

    const result = await queries.getAlimentsParBac(bac);

    expect(result).toEqual(mockAliments);
    expect(dbMock.aliment.findMany).toHaveBeenCalledWith({
      where: { bac: bac },
      orderBy: { nom: 'asc' }
    });
  });

  // test getAlimentById
  it('getAlimentById', async () => {
    const mockAliment = { id: 10, nom: 'Riz', bac: 'RIZ' };
    dbMock.aliment.findUnique.mockResolvedValue(mockAliment);
    const result = await queries.getAlimentById(10);
    expect(result).toEqual(mockAliment);
    expect(dbMock.aliment.findUnique).toHaveBeenCalledWith({
      where: { id: 10 }
    });
  });

  // test getAllAliments
  it('getAllAliments', async () => {
    const mockAliments = [{ id: 1, nom: 'Avocat' }];
    dbMock.aliment.findMany.mockResolvedValue(mockAliments);
    const result = await queries.getAllAliments();
    expect(result).toEqual(mockAliments);
    expect(dbMock.aliment.findMany).toHaveBeenCalledWith({
      orderBy: { nom: 'asc' }
    });
  });

  // test sauvegarderPlanning
  it('sauvegarderPlanning', async () => {
    const params = {
      auteurId: 1,
      nom: 'Planning de Ronnie',
      journal: [
        {
          repas: [
            {
              moment: 'DEJEUNER',
              template: 'HOT',
              aliments: [
                { poids: 200, aliment: { id: 5, nom: 'Poulet' } }
              ]
            }
          ]
        }
      ]
    };

    dbMock.planning.create.mockResolvedValue({ id: 100, nom: params.nom });
    await queries.sauvegarderPlanning(params as any);
    expect(dbMock.planning.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nom: 'Planning de Ronnie',
        auteurId: 1,
        repas: expect.objectContaining({
          create: expect.any(Array)
        })
      }),
      include: {
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
    });
  });

  // test getPlanningsUtilisateur
  it('getPlanningsUtilisateur', async () => {
    dbMock.planning.findMany.mockResolvedValue([]);
    await queries.getPlanningsUtilisateur(1);
    expect(dbMock.planning.findMany).toHaveBeenCalledWith({
      where: { auteurId: 1 },
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
        }
      },
      orderBy: { id: 'desc' }
    });
  });

  // test supprimerPlanning
  it('supprimerPlanning', async () => {
    const idPlanning = 50;
    dbMock.$transaction.mockImplementation(async (callback: any) => await callback(dbMock));
    dbMock.post.deleteMany.mockResolvedValue({ count: 0 });
    dbMock.calendrierPlanning.findMany.mockResolvedValue([{ programmeId: 10 }]);
    dbMock.calendrierPlanning.updateMany.mockResolvedValue({ count: 1 });
    dbMock.planning.delete.mockResolvedValue({ id: idPlanning } as any);

    const result = await queries.supprimerPlanning(idPlanning);

    expect(result.id).toBe(idPlanning);
    expect(dbMock.planning.delete).toHaveBeenCalledWith({
      where: { id: idPlanning }
    });
  });

  // test majPlanning
  it('majPlanning', async () => {
    const mockRepas = [
      {
        portions: [
          { id: 1, quantite: 200, aliment: { id: 5 } },
          { id: 2, quantite: 150, aliment: { id: 8 } }
        ]
      }
    ];

    dbMock.$transaction.mockResolvedValue([]);
    await queries.majPlanning(mockRepas);
    expect(dbMock.portion.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ quantite: 200 })
    }));
  });


  // test majInfosPlanning
  it('majInfosPlanning', async () => {
    const idPlanning = 10;
    const updateData = { nom: 'poulet max', description: 'plus de poulet dans les repas' };
    dbMock.planning.update.mockResolvedValue({ id: idPlanning, ...updateData });
    const result = await queries.majInfosPlanning(idPlanning, updateData);
    expect(result.nom).toBe('poulet max');
    expect(dbMock.planning.update).toHaveBeenCalledWith({
      where: { id: idPlanning },
      data: updateData
    });
  });

  // test getProgrammesUtilisateur
  it('getProgrammesUtilisateur', async () => {
    dbMock.programme.findMany.mockResolvedValue([]);
    await queries.getProgrammesUtilisateur(1);
    expect(dbMock.programme.findMany).toHaveBeenCalledWith({
      where: { auteurId: 1 },
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
          },
          orderBy: { ordre: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  // test creerProgrammeComplet
  it('creerProgrammeComplet', async () => {
    const inputData = {
      nom: 'Programme de Ronnie',
      description: 'Yeah buddy',
      auteurId: 1,
      semaines: [
        { planningId: 5, semaineDebut: new Date(), ordre: 1 }
      ]
    };

    dbMock.programme.create.mockResolvedValue({ id: 100, ...inputData });
    await queries.creerProgrammeComplet(inputData as any);
    expect(dbMock.programme.create).toHaveBeenCalledWith({
      data: {
        nom: 'Programme de Ronnie',
        description: 'Yeah buddy',
        auteurId: 1,
        semaines: {
          create: expect.any(Array)
        }
      },
      include: { 
        semaines: { 
          include: { planning: true } 
        } 
      }
    });
  });

  // test supprimerProgramme
  it('supprimerProgramme', async () => {
    const idProg = 99;
    dbMock.programme.delete.mockResolvedValue({ id: idProg });

    await queries.supprimerProgramme(idProg);

    expect(dbMock.programme.delete).toHaveBeenCalledWith({
      where: { id: idProg }
    });
  });

  // test viderTousLesProgrammes
  it('viderTousLesProgrammes', async () => {
    dbMock.programme.deleteMany.mockResolvedValue({ count: 5 });
    const result = await queries.viderTousLesProgrammes(1);
    expect(result.count).toBe(5);
    expect(dbMock.programme.deleteMany).toHaveBeenCalledWith({
      where: { auteurId: 1 }
    });
  });

  // test majInfosProgramme
  it('majInfosProgramme', async () => {
    const idProg = 20;
    const updateData = { nom: 'Nouveau Programme Muscle', description: 'Yeah Buddy!' };
    dbMock.programme.update.mockResolvedValue({ id: idProg, ...updateData });

    const result = await queries.majInfosProgramme(idProg, updateData);

    expect(result.nom).toBe('Nouveau Programme Muscle');
    expect(dbMock.programme.update).toHaveBeenCalledWith({
      where: { id: idProg },
      data: updateData,
      include: {
        semaines: {
          include: { planning: true }
        }
      }
    });
  });


  // test creerPost
  it('creerPost', async () => {
    const postInput = {
      titre: 'Repas de muscu',
      contenu: 'Lightweight baby',
      auteurId: 1,
      programmeId: null,
      planningId: 5,
      repasId: null
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
        planningId: 5,
        repasId: null
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
          select: { prenom: true, nom: true, email: true }
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