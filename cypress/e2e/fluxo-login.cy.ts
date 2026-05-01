import '../support/commands';

describe('Login Múltiplos Perfis (E2E)', () => {

  const rolesTest = [
    { role: 'admin',      expectedUser: 'admin' },
    { role: 'secretaria', expectedUser: 'gabriela' },
    { role: 'professor',  expectedUser: 'joao' },
    { role: 'comunicacao',expectedUser: 'carlos' }
  ];

  it('1. Deve rejeitar senha errada (Independente do Role)', () => {
    cy.visit('/login');

    // Intercepta a requisição POST auth/login para sincronizar o assertions pós-submit
    cy.intercept('POST', '**/auth/login').as('loginReq');

    cy.get('#username', {timeout: 10000}).should('be.visible').clear().type('admin', {delay: 50});
    cy.get('#senha').should('be.visible').clear().type('SenhaMaluquinha123', {delay: 50});
    
    // Submete
    cy.get('button[type="submit"]').click();
    
    // Aguarda a resposta (mesmo que 401 Unauthorized) antes de buscar a DIV
    cy.wait('@loginReq');
    
    // Teste Assertivo de UI - Falha graciosamente com a janela do Toast PrimeNG ou Alert
    cy.url().should('include', '/login');
    cy.get('.alert-erro', {timeout: 8000}).should('be.visible');
  });

  rolesTest.forEach(({ role, expectedUser }) => {
    it(`2. Deve realizar login com Sucesso [ROLE: ${role.toUpperCase()}]`, () => {
      
      // O comando customizado abaixo preenche os inputs nativos (#username, #senha) e dá enter.
      cy.loginByRole(role);
      
      // Validação dupla (Painel carregado e AuthGuard satisfeito sem UI bloqueadora)
      cy.url().should('include', '/admin');
      
      // Abre o modal de Perfil do Header Global do Braille-frontend
      cy.get('.user-menu-btn').click(); 
      
      // Atesta no modal/overlay que a String Logada corresponde ao Role mapeado
      cy.get('.user-dropdown', { timeout: 10000 }).should('be.visible');
      cy.contains(expectedUser, { matchCase: false }).should('be.visible');

      // Logout limpo (Prepara para iterar o próximo role limpando LocalStorage na sessão do Cypress)
      cy.contains('Sair').click();
      cy.url().should('include', '/login');
    });
  });

});
