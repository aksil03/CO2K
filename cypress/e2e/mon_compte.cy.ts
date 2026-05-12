describe('Test Page Mon Compte', () => {
  const userTest = {
    id: 1,
    prenom: 'testeur',
    nom: 'test',
    email: 'test@gmail.com',
    programmes: [{ id: 101, nom: 'Programme Force' }],
    plannings: [{ id: 201, nom: 'Planning Sèche' }]
  }

  const postsMock = [
    {
      id: 10,
      titre: "Ancien Post Programme",
      contenu: "Description programme",
      auteurId: 1,
      auteur: { id: 1, nom: "test", prenom: "testeur" },
      programme: { id: 101, nom: "Programme Force" },
      planning: null,
      commentaires: [],
      likes: [],
      _count: { likes: 5, commentaires: 2 },
      createdAt: new Date().toISOString()
    }
  ]

  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, id: 1, email: userTest.email }));
  const fauxTokenValide = `header.${payload}.signature`;

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.intercept('GET', '**/api/utilisateur*', { statusCode: 200, body: userTest }).as('getUser')
    cy.intercept('GET', '**/api/aliments/all', { statusCode: 200, body: {} }).as('getAliments')
    cy.intercept('GET', '**/api/communaute/feed', { statusCode: 200, body: [] }).as('getFeed')
    cy.intercept('GET', '**/api/posts/utilisateur/1', { statusCode: 200, body: postsMock }).as('getMesPosts')

    cy.visit(`http://localhost:5173/dashboard/${userTest.email}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', fauxTokenValide)
        win.localStorage.setItem('user_email', userTest.email)
      }
    })

    cy.wait(['@getUser', '@getAliments', '@getFeed'])
    cy.contains('Mon Profil').should('be.visible').click({ force: true })
    cy.wait('@getMesPosts')
  })

  it('Affiche les publications personnelles avec le compteur à jour', () => {
    cy.get('h1').should('contain', 'test')
    cy.get('#total-posts-count').should('contain', '1')
    cy.contains('Ancien Post Programme').should('exist')
  })

  it('Crée une nouvelle publication', () => {
    const newPost = {
      id: 11,
      titre: "Ma nouvelle routine",
      contenu: "Super description",
      auteurId: 1,
      auteur: { id: 1, nom: "test", prenom: "testeur" },
      planning: { id: 201, nom: "Planning Sèche" },
      programme: null,
      commentaires: [],
      likes: [],
      _count: { likes: 0, commentaires: 0 },
      createdAt: new Date().toISOString()
    }

    cy.intercept('POST', '**/api/posts/creer', { statusCode: 201, body: newPost }).as('createPost')
    cy.intercept('GET', '**/api/posts/utilisateur/1', { statusCode: 200, body: [...postsMock, newPost] }).as('getMesPostsRefresh')
    cy.get('#btn-ouvrir-modal-post').click({ force: true })
    cy.get('#tab-select-planning').click({ force: true })
    cy.get('#input-post-titre').type('Ma nouvelle routine')
    cy.get('#input-post-contenu').type('Super description')
    cy.get('button[role="combobox"]').click({ force: true })
    cy.get('div[role="option"]').contains('Planning Sèche').click({ force: true })
    cy.get('#btn-valider-publication').should('not.be.disabled').click({ force: true })
    cy.wait('@createPost')
    cy.contains('Publication partagée').should('be.visible')
    cy.get('#total-posts-count').should('contain', '2')
    cy.contains('Ma nouvelle routine').scrollIntoView().should('be.visible')
  })

  it('Supprime un post après confirmation dans le toast', () => {
    cy.intercept('DELETE', '**/api/posts/10', { statusCode: 204 }).as('deletePost')
    cy.intercept('GET', '**/api/posts/utilisateur/1', { statusCode: 200, body: [] }).as('getMesPostsEmpty')
    cy.get('button').find('svg.lucide-trash2').first().click({ force: true })
    cy.contains('button', 'Confirmer').should('be.visible').click({ force: true })
    cy.wait('@deletePost')
    cy.contains('Supprimé').should('be.visible')
    cy.get('#total-posts-count').should('contain', '0')
    cy.contains('Votre profil est vide').should('be.visible')
  })

  it('Affiche état vide quand utilisateur a rien posté', () => {
    cy.intercept('GET', '**/api/posts/utilisateur/1', { statusCode: 200, body: [] }).as('getNoPosts')
    cy.contains('Profil').click({ force: true })
    cy.contains('Mon Profil').click({ force: true })
    cy.wait('@getNoPosts')
    cy.contains('Votre profil est vide').should('be.visible')
  })
})