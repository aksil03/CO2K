describe('Test Page Panel', () => {
  const userTest = {
    id: 1,
    prenom: 'test',
    email: 'test@gmail.com',
    poids: 75,
    taille: 180,
    age: 25,
    genre: 'HOMME',
    objectif: 'MAINTIEN',
    activite: 'MODERE',
    programmes: [
      { id: 101, nom: 'Prise de Masse', semaines: [] }
    ],
    plannings: [
      {
        id: 201,
        nom: 'Planning Semaine 1',
        repas: [
          {
            id: 50,
            numJour: 1,
            dateConsom: new Date().toISOString(),
            type: 'DEJEUNER',
            nomTemplate: 'HOT',
            portions: [
              {
                id: 1,
                quantite: 200,
                aliment: { nom: 'Poulet', prot: 25, glu: 0, lip: 3, co2: 5.5, cal: 150 }
              }
            ]
          }
        ]
      }
    ]
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

    cy.contains('Panel').click()
    cy.get('h1', { timeout: 10000 }).should('contain', 'Panel')
  })


  it('Affiche la liste des programmes et des plannings', () => {
    cy.contains('Programmes').should('be.visible')
    cy.contains('Prise de Masse').should('exist')
    cy.contains('Plannings').should('be.visible')
    cy.contains('Planning Semaine 1').should('exist')
  })

  it('Ouvre la vue détail dun planning et valide les calculs nutritionnels', () => {
    cy.get('#btn-view-plan-201').click({ force: true })
    cy.get('#view-planning-title').should('contain', 'Planning Semaine 1')
    cy.get('#stats-prot').first().invoke('text').then((val) => {
      const num = parseInt(val)
      // @ts-ignore
      expect(num).to.be.greaterThan(0);
    })
  })

  it('Supprime un programme apres confirmation dans le toast', () => {
    cy.intercept('DELETE', '**/api/programmes/101', { statusCode: 200 }).as('deleteRequest')
    cy.get('#btn-delete-prog-101').click({ force: true })
    cy.contains('button', 'Confirmer').should('be.visible').click()
    cy.wait('@deleteRequest')
    cy.contains('Programme supprimé').should('exist')
    cy.get('#btn-delete-prog-101').should('not.exist')
  })

  it('Affiche un message alerte quand le panel est vide', () => {
    cy.intercept('GET', '**/api/utilisateur*', {
      statusCode: 200,
      body: { ...userTest, programmes: [], plannings: [] }
    }).as('getEmptyUser')
    cy.reload()
    cy.wait('@getEmptyUser')
    cy.contains('Votre panel est vide').should('be.visible')
  })
})