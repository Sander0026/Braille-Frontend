/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
       loginByRole(role: string): Chainable<void>;
       teardownAluno(cpf: string): Chainable<void>;
    }
  }
}
export {};

Cypress.Commands.add('loginByRole', (role: string) => {
  const roleMap: Record<string, string> = {
    'admin': 'admin',
    'secretaria': 'gabriela',
    'professor': 'joao',
    'comunicacao': 'carlos'
  };

  const username = roleMap[role.toLowerCase()] || 'admin';
  
  cy.visit('/login'); 
  cy.get('.form-heading').should('be.visible');

  // Usando data-cy (Boa prática) em vez de IDs se possível, mas mantive os IDs para compatibilidade com seu HTML atual
  cy.get('#username').should('be.enabled').clear().type(username, { delay: 50 });
  cy.get('#senha').should('be.enabled').clear().type('Admin123!', { delay: 50 });
  
  cy.get('button[type="submit"]').click();

  cy.url({ timeout: 15000 }).should('include', '/admin');
  cy.get('app-admin-layout', { timeout: 10000 }).should('be.visible');
});

// Teardown Pós-Teste 100% Seguro (Sem Race Conditions)
Cypress.Commands.add('teardownAluno', (cpf: string) => {
  cy.window().its('localStorage').invoke('getItem', 'braille_token').then((token) => {
    if (token) {
        // Primeiro, descobre o ID real do Aluno-Fantasma pelo CPF
        cy.request({
            method: 'GET',
            url: `http://localhost:3000/beneficiaries/check-cpf-rg?cpf=${cpf}`,
            headers: { 'Authorization': `Bearer ${token}` },
            failOnStatusCode: false
        }).then((response) => {
            if (response.body && response.body.status !== 'livre' && response.body.id) {
                // Encontrado! Agora limpa ele pra valer via HARD DELETE
                cy.request({
                    method: 'DELETE',
                    url: `http://localhost:3000/beneficiaries/${response.body.id}/hard`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    failOnStatusCode: false
                });
            } else {
                cy.log(`⚠️ CPF ${cpf} não localizado na API para Teardown.`);
            }
        });
    } else {
        cy.log('⚠️ Token não encontrado para o Teardown.');
    }
  });
});