describe('Test Page Plannings', () => {
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
    regime: 'STANDARD'
  }

  const alimentsTest = [
    { id: 1, nom: 'Poulet', prot: 25, glu: 0, lip: 3, co2: 5.5, cal: 130, bac: 'PROT_VOLAILLE' },
    { id: 2, nom: 'Riz', prot: 2, glu: 28, lip: 0.5, co2: 1.2, cal: 150, bac: 'RIZ' },
    { id: 3, nom: 'Brocoli', prot: 3, glu: 7, lip: 0, co2: 0.4, cal: 35, bac: 'LEG' }
  ]

  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, id: 1, email: userTest.email }));
  const fauxTokenValide = `header.${payload}.signature`;

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.intercept('GET', '**/api/utilisateur*', { statusCode: 200, body: userTest }).as('getUser')
    cy.intercept('GET', '**/api/aliments/all', { 
      statusCode: 200, 
      body: { 
        'PROT_VOLAILLE': [alimentsTest[0]],
        'RIZ': [alimentsTest[1]],
        'LEG': [alimentsTest[2]]
      } 
    }).as('getAliments')
    cy.intercept('GET', '**/api/communaute/feed', { statusCode: 200, body: [] }).as('getFeed')

    cy.visit(`http://localhost:5173/dashboard/${userTest.email}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', fauxTokenValide)
        win.localStorage.setItem('user_email', userTest.email)
      }
    })

    cy.wait(['@getUser', '@getAliments', '@getFeed'])
    cy.contains('Plannings').click()
    cy.get('#stats-kcal-valeur', { timeout: 10000 }).should('exist')
  })

  it('Affiche les objectifs caloriques initiaux à zéro', () => {
    cy.get('#stats-kcal-valeur').should('contain', '0')
    cy.get('#stats-co2-valeur').should('contain', '0.00')
  })

  it('Change de jour et vérifie l\'affichage', () => {
    cy.get('#btn-jour-2').click()
    cy.contains('Impact J02').should('exist')
    cy.get('#btn-jour-2').should('have.class', 'bg-white')
  })

  it('Génère une semaine complète avec IA et vérifie le contenu', () => {
    cy.intercept('POST', '**/api/planning/sauvegarder', {
      statusCode: 201,
      body: { message: "Success" }
    }).as('saveIA')

    cy.get('#btn-generer-ia').click()

    cy.wait('@saveIA')

    cy.contains('Planning généré').should('exist')
    
    cy.get('#journal-ia-jour-1', { timeout: 10000 }).within(() => {
      
      cy.get('#stats-ia-kcal-jour-1').invoke('text').then((val) => {
        const kcal = parseInt(val)
        expect(kcal).to.be.greaterThan(0) 
      })
    })
  })

  it('Vérifie le Copier/Coller et la Sauvegarde', () => {
    cy.get('#btn-copier-planning').click()
    cy.get('#btn-coller-planning').should('be.visible')
    
    cy.get('#btn-sauvegarder-planning')
      .should('exist')
      .and('be.disabled')
      .and('have.class', 'grayscale')
  })
})