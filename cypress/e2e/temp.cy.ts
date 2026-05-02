describe('Diagnosticar Roteamento', () => {
  it('Tenta navegar pelas rotas e checa erros no console', () => {
    cy.on('uncaught:exception', (err, runnable) => {
      console.error('APLICATION ERROR CAUGHT BY CYPRESS:', err.message);
      return false;
    });

    cy.loginByRole('admin');
    cy.visit('/admin/dashboard');

    cy.log('Clicando em Alunos');
    cy.contains('.sidebar-nav a', 'Alunos').click();
    cy.wait(1000);
    cy.url().should('include', '/admin/alunos');
    
    cy.log('Clicando em Turmas');
    cy.contains('.sidebar-nav a', 'Turmas').click();
    cy.wait(1000);
    cy.url().should('include', '/admin/turmas');
  });
});
