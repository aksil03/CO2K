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

describe('Tests unitaires aliments', () => {

    beforeEach(() => {
        jest.clearAllMocks();
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
});