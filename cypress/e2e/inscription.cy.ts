describe('Test Inscription', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('http://localhost:5173/inscription') 
  })

  it('Formulaire vide', () => {
    cy.get('button[type="submit"]').click()
    cy.get('.text-red-500').should('be.visible')
    cy.url().should('include', '/inscription')
  })

  it('Email déjà utilisé', () => {
    cy.intercept('POST', '**/api/inscription', {
      statusCode: 500,
      body: { message: 'error' }
    }).as('inscriptionFail')
    cy.get('input[name="nom"]').type('testeur')
    cy.get('input[name="prenom"]').type('Test')
    cy.get('input[name="email"]').type('deja@pris.fr')
    cy.get('input[name="password"]').type('mdptest')
    cy.get('button[type="submit"]').click()
    cy.wait('@inscriptionFail')
    cy.contains("Erreur d'inscription").should('be.visible')
    cy.url().should('include', '/inscription')
  })

  it('Inscription réussie', () => {
    cy.intercept('POST', '**/api/inscription', {
      statusCode: 201,
      body: { id: 999, message: "Utilisateur créé virtuellement" }
    }).as('inscriptionSuccess')
    cy.get('input[name="nom"]').type('testeur')
    cy.get('input[name="prenom"]').type('Test')
    cy.get('input[name="email"]').type('test@virtuel.fr')
    cy.get('input[name="password"]').type('mdptest')
    cy.get('input[name="age"]').clear().type('25')
    cy.get('input[name="taille"]').clear().type('180')
    cy.get('input[name="poids"]').clear().type('75')
    cy.get('button[type="submit"]').click()
    cy.wait('@inscriptionSuccess')
    cy.contains('Compte créé avec succès').should('be.visible')
    cy.get('input[name="nom"]').should('have.value', '')
  })
})