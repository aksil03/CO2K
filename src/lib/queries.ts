import { db } from './db.ts';
import type { InscriptionData } from './types.ts'; 
import type { ProfilData } from './types';
import type { Aliment } from './types.ts';
import type { SavePlanningData, JourneePlanning, RepasGenere, PanierItem, CreatePostData } from './types.ts';

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
      repas: true,
      badges: { include: { badge: true } },
      plannings: true,
      programmes: { 
        include: {
          semaines: true
        }
      },
      _count: {
        select: {
          mesAbonnes: true,
          mesAbonnements: true,
          programmes: true 
        }
      }
    }
  });
};

// creer un user dans la bdd
export const ajouterUtilisateur = async (userData: InscriptionData) => {
  return await db.utilisateur.create({
    data: userData
  });
};


// Maj profil
export const majProfil = async (email: string, data: ProfilData) => {
  return await db.utilisateur.update({
    where: { email },
    data: data 
  });
};

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

// sauvegarde un planning
export const sauvegarderPlanning = async (params: SavePlanningData) => {
  const { auteurId, nom, journal } = params;

  return await db.planning.create({
    data: {
      nom: nom,
      auteurId: auteurId,
      repas: {
        create: journal.flatMap((unJour: JourneePlanning, index: number) => {
          const dateCible = new Date();
          dateCible.setDate(dateCible.getDate() + index);

          return unJour.repas.map((unRepas: RepasGenere) => ({
            dateConsom: dateCible,
            type: unRepas.moment,
            nomTemplate: unRepas.template || "HOT",
            utilisateurId: auteurId, 
            portions: {
              create: unRepas.aliments.map((al: PanierItem) => ({
                quantite: al.poids,
                alimentId: al.aliment.id,
              }))
            }
          }));
        })
      }
    },
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
      }
    },
    orderBy: { id: 'desc' }
  });
};

// Supprimer un planning 
export const supprimerPlanning = async (id: number) => {
  return await db.planning.delete({
    where: { id }
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
export const majInfosPlanning = async (id: number, data: { nom?: string, estPublic?: boolean, description?: string }) => {
  return await db.planning.update({
    where: { id },
    data: data
  });
};

// Récupère tous les programmes d'un utilisateur
export const getProgrammesUtilisateur = async (userId: number) => {
  return await db.programme.findMany({
    where: { auteurId: userId },
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
      semaines: {
        include: {
          planning: true
        }
      }
    }
  });
};

// Créer un nouveau post
export const creerPost = async (data: CreatePostData) => {
  return await db.post.create({
    data: {
      titre: data.titre,
      contenu: data.contenu,
      imageUrl: data.imageUrl,
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
        }
      },
      likes: {
        where: {
          userId: userId
        }
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
        select: { prenom: true, nom: true, email: true }
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
