import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../server';
import { db } from '../../../src/lib/db';

describe('Tests d\'intégration de l\'API CO2K', () => {

  // ici nous allons tester la récuperation des aliments
  it('GET /api/aliments/all - devrait retourner le catalogue groupé par BAC', async () => {
    const response = await request(app).get('/api/aliments/all');
    
    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
  });

  // on test la récuperation d'un utilisateur
  it('GET /api/utilisateur - on va retourner 404 si l\'email n\'existe pas', async () => {
    const response = await request(app)
      .get('/api/utilisateur')
      .query({ email: 'fantome@test.com' });
    
    expect(response.status).toBe(404);
    expect(response.text).toBe("Utilisateur non trouvé");
  });

  // 3. Test de sécurité Zod
  it('POST /api/inscription - devrait retourner 500 si les données sont invalides (Zod)', async () => {
    const mauvaisUtilisateur = {
      email: "pas-un-email",
      nom: "J"
    };

    const response = await request(app)
      .post('/api/inscription')
      .send(mauvaisUtilisateur);
    expect(response.status).toBe(500);
    expect(response.text).toBe("Erreur serveur");
  });

  // 4. Test de la partie community
  it('GET /api/communaute/feed - devrait retourner une liste de posts', async () => {
    const response = await request(app).get('/api/communaute/feed');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();


  });

  afterAll(async ()=>{

      await db.$disconnect();
    })

});