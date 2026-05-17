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
    cy.window().then((win) => win.sessionStorage.clear())

    cy.intercept('GET', '**/api/utilisateur*', { statusCode: 200, body: userTest }).as('getUser')
    cy.intercept('GET', '**/api/aliments/all', { statusCode: 200, body: {} }).as('getAliments')
    cy.intercept('GET', '**/api/communaute/feed', { statusCode: 200, body: [] }).as('getFeed')

    cy.visit(`http://localhost:5173/dashboard/${userTest.email}`, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('token', fauxTokenValide)
        win.sessionStorage.setItem('user_email', userTest.email)
      }
    })

    cy.wait(['@getUser', '@getAliments', '@getFeed'])
    cy.wait(500)

    cy.contains('Profil').click()
  })

  it('Affiche les besoins nutritionnels et recalcule lors de la modification', () => {
    cy.contains(userTest.prenom).should('be.visible')
    cy.get('[data-testid="calories-display"]').invoke('text').then((valInitiale) => {
      cy.contains('label', 'Poids (kg)').parent().find('input').clear().type('95')
      cy.get('[data-testid="calories-display"]').invoke('text').should((valFinale) => {
        // @ts-ignore
        expect(valInitiale).to.not.equal(valFinale);
      })
    })
  })

  it('Sauvegarde les modifications', () => {
    cy.intercept('PUT', '**/api/utilisateur/update/*', { statusCode: 200 }).as('saveProfile')
    cy.contains('label', 'Poids (kg)').parent().find('input').clear().type('90')
    cy.contains('button', 'Sauvegarder les modifications').click()
    cy.wait('@saveProfile')
    cy.contains('Profil mis à jour').should('exist')
  })
})
