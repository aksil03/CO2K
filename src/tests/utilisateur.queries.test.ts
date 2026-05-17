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

describe('Tests unitaires utilisateurs', () => {

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

        expect(dbMock.utilisateur.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { email: 'test@gmail.com' }
            })
        );
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
            data: expect.objectContaining({
                ...inputData,
                password: expect.any(String)
            })
        });
    });

    // Test d'exception sur bdd
    it('ajouterUtilisateur exception si bdd échoue', async () => {
        const errorData = { nom: 'Erreur', password: 'MDP_test' };
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
});
