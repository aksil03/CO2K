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

describe('Tests unitaires planning', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        dbMock.$transaction.mockImplementation(async (callback: any) => await callback(dbMock));
    });

    // test sauvegarderPlanning
    it('sauvegarderPlanning', async () => {
        const params = {
            auteurId: 1,
            nom: 'Planning de Ronnie',
            repas: [
                {
                    moment: 'DEJEUNER',
                    template: 'HOT',
                    numJour: 1,
                    aliments: [
                        { poids: 200, aliment: { id: 5, nom: 'Poulet' } }
                    ]
                }
            ]
        };

        dbMock.planning.create.mockResolvedValue({ id: 100, nom: params.nom });
        await queries.sauvegarderPlanning(params as any);
        expect(dbMock.planning.create).toHaveBeenCalledWith({
            data: {
                nom: 'Planning de Ronnie',
                auteurId: 1,
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
});
