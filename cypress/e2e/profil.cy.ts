describe('Test Profil Utilisateur', () => {
  const userTest = {
    id: 1,
    prenom: 'test',
    nom: 'Testeur',
    email: 'test@gmail.com',
    poids: 75,
    taille: 180,
    age: 25,
    genre: 'HOMME',
    objectif: 'MAINTIEN',
    activite: 'MODERE',
    regime: 'STANDARD'
  }

  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, id: 1, email: userTest.email }));
  const fauxTokenValide = `header.${payload}.signature`;

  beforeEach(() => {
    cy.clearLocalStorage()

    cy.intercept('GET', '**/api/utilisateur*', { statusCode: 200, body: userTest }).as('getUser')
    cy.intercept('GET', '**/api/aliments/all', { statusCode: 200, body: {} }).as('getAliments')
    cy.intercept('GET', '**/api/communaute/feed', { statusCode: 200, body: [] }).as('getFeed')

    cy.visit(`http://localhost:5173/dashboard/${userTest.email}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', fauxTokenValide)
        win.localStorage.setItem('user_email', userTest.email)
      }
    })
    
    cy.wait(['@getUser', '@getAliments', '@getFeed'])
    
    // Utilisation de l'ID pour naviguer vers le profil
    cy.get('#nav-profil').click()
  })

  it('Affiche les besoins nutritionnels et recalcule lors de la modification', () => {
    // On vérifie que le prénom est là (on peut garder contains pour du texte dynamique)
    cy.contains(userTest.prenom).should('be.visible')
    
    // On récupère la valeur initiale via l'ID
    cy.get('#display-calories').invoke('text').then((valInitiale) => {
      
      // On modifie le poids via l'ID de l'input
      cy.get('#input-poids').clear().type('95')
      
      // On vérifie que l'affichage des calories a changé
      cy.get('#display-calories').invoke('text').should((valFinale) => {
        expect(valInitiale).to.not.equal(valFinale)
      })
    })
  })

  it('Sauvegarde les modifications avec succès', () => {
    cy.intercept('PUT', '**/api/utilisateur/update/*', { statusCode: 200 }).as('saveProfile')
    
    // Modification du poids
    cy.get('#input-poids').clear().type('90')
    
    // Clic sur Sauvegarder via l'ID
    cy.get('#btn-save-profil').click()
    
    cy.wait('@saveProfile')
    
    // Le toast/message de succès peut rester en contains car c'est un message global
    cy.contains('Profil mis à jour').should('exist')
  })
})