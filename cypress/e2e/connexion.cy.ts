describe('Test Connexion', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('http://localhost:5173/login') 
  })

  it('Formulaire vide', () => {
    cy.get('button[type="submit"]').click()
    // message erreur
    cy.get('.text-red-500').should('be.visible')
    // aucune redirection
    cy.url().should('include', '/login')
    // local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })

  it('Mauvais identifiants', () => {
    cy.intercept('POST', '**/api/connexion', {
      statusCode: 401,
      body: { message: 'error' }
    }).as('loginFail')

    cy.get('input[name="email"]').type('test@test.fr')
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginFail')
    cy.contains('Échec de la connexion').should('be.visible')
    cy.url().should('include', '/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })

  it('Connexion réussie', () => {
    cy.get('input[name="email"]').type('test@gmail.com')
    cy.get('input[name="password"]').type('test')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
    cy.contains('Connexion réussie').should('be.visible')
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token')
      expect(token).to.not.be.null
    })
  })
})