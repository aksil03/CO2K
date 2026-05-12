describe('Test Page Communauté', () => {
  const userTest = {
    id: 1,
    prenom: 'Moi',
    email: 'test@gmail.com',
    mesAbonnements: []
  }

  const feedMock = [
    {
      id: 100,
      titre: "plan de musculation",
      contenu: "Force et honneur",
      auteurId: 2,
      auteur: { id: 2, nom: "test", prenom: "testeur" },
      programme: { id: 500, nom: "Old School Body" },
      likes: [],
      commentaires: [],
      _count: { likes: 10, commentaires: 5 },
      createdAt: new Date().toISOString()
    },
    {
      id: 101,
      titre: "Petit dej",
      contenu: "Des oeufs et de l'avoine",
      auteurId: 3,
      auteur: { id: 3, nom: "colmane", prenom: "ronnie" },
      planning: { id: 600, nom: "Mass Diet" },
      likes: [],
      commentaires: [],
      _count: { likes: 100, commentaires: 20 },
      createdAt: new Date().toISOString()
    }
  ]

  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, id: 1, email: userTest.email }));
  const fauxTokenValide = `header.${payload}.signature`;

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.intercept('GET', '**/api/utilisateur*', { statusCode: 200, body: userTest }).as('getUser')
    cy.intercept('GET', '**/api/aliments/all', { statusCode: 200, body: {} }).as('getAliments')
    cy.intercept('GET', '**/api/communaute/feed', { statusCode: 200, body: feedMock }).as('getFeed')

    cy.visit(`http://localhost:5173/dashboard/${userTest.email}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', fauxTokenValide)
        win.localStorage.setItem('user_email', userTest.email)
      }
    })
    cy.wait(['@getUser', '@getAliments', '@getFeed'])
    cy.contains('Explorer').should('be.visible').click({ force: true })
  })

  it('Affiche le flux global et permet de changer donglet', () => {
    cy.contains('Fil Social').should('exist')
    cy.contains('testeur test').should('exist')
    cy.contains('ronnie colmane').scrollIntoView().should('exist')
    cy.contains('button', 'Abonnements').click({ force: true })
    cy.contains('Votre feed est vide').should('be.visible')
  })

  it('Permet de visiter le profil dun auteur et de sabonner', () => {
    cy.intercept('GET', '**/api/follow/status*', { statusCode: 200, body: { isFollowing: false } }).as('getFollowStatus')
    cy.contains('testeur test').click({ force: true })
    cy.wait('@getFollowStatus')
    cy.get('h1').should('contain', 'test')
    cy.intercept('POST', '**/api/follow/toggle', { statusCode: 200, body: { isFollowing: true } }).as('toggleFollow')
    cy.contains('button', "S'abonner").should('exist').click({ force: true })
    cy.wait('@toggleFollow')
    cy.contains('Abonné').should('exist')
  })

  it('Gère le désabonnement', () => {
    cy.intercept('GET', '**/api/follow/status*', { statusCode: 200, body: { isFollowing: true } }).as('statusAlreadyFollow')
    cy.contains('ronnie colmane').scrollIntoView().click({ force: true })
    cy.wait('@statusAlreadyFollow')
    cy.intercept('POST', '**/api/follow/toggle', { statusCode: 200, body: { isFollowing: false } }).as('toggleUnfollow')
    cy.contains('button', 'Abonné').should('exist').click({ force: true })
    cy.wait('@toggleUnfollow')
    cy.contains("S'abonner").should('exist')
    cy.contains('Désabonné').should('exist')
  })

  it('Permet de revenir au flux global depuis un profil', () => {
    cy.contains('testeur test').click({ force: true })
    cy.contains('button', 'Retour').should('exist').click({ force: true })
    cy.contains('Fil Social').should('exist')
  })
})