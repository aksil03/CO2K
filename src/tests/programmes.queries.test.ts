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

describe('Tests unitaires programmes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // test getProgrammesUtilisateur
    it('getProgrammesUtilisateur', async () => {
        dbMock.programme.findMany.mockResolvedValue([]);
        await queries.getProgrammesUtilisateur(1);
        expect(dbMock.programme.findMany).toHaveBeenCalledWith({
            where: { auteurId: 1 },
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
                posts: true,
                semaines: {
                    include: { planning: true }
                }
            }
        });
    });
});
