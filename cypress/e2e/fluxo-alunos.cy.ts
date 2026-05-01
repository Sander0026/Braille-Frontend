import '../support/commands';
// Importação necessária para o TypeScript reconhecer o checkA11y
import 'cypress-axe';

// Função auxiliar para imprimir os erros de acessibilidade bonitos no terminal
function terminalLog(violations: any[]) {
   cy.task('log', `${violations.length} problemas de acessibilidade encontrados no Modal.`);
   const violationData = violations.map(({ id, impact, description, nodes }: any) => ({
      id, impact, description, nodes: nodes.length
   }));
   cy.task('table', violationData);
}

describe('Gestão de Alunos (E2E) com RBAC e Teardown', () => {

   const generateCpf = () => {
      const r = () => Math.floor(Math.random() * 9).toString();
      return `${r()}${r()}${r()}.${r()}${r()}${r()}.${r()}${r()}${r()}-${r()}${r()}`;
   };

   const cliRole = Cypress.env('role') || 'admin';

   it('1. Deve bloquear a tela de Listagem de Aluno para Professores', function () {
      if (cliRole !== 'professor') {
         this.skip();
      }

      cy.loginByRole('professor');
      cy.get('.sidebar').should('not.contain', 'Alunos');
   });

   it('2. Deve permitir a Criação do Aluno (Admin/Secretaria), Auditar A11Y e Limpar BD', function () {
      if (!['admin', 'secretaria'].includes(cliRole)) {
         this.skip();
      }
      
      const currentCpfTest = generateCpf(); // Sempre um novo CPF, mesmo em retentativas!
      const currentRgTest = Math.floor(Math.random() * 999999999).toString(); // RG Aleatório Ex: 457891234

      cy.loginByRole(cliRole);
      cy.log(`Executando Teste de Aluno via Papel: ${cliRole.toUpperCase()}`);
      cy.log(`CPF de Teste Gerado: ${currentCpfTest}`);
      cy.log(`RG de Teste Gerado: ${currentRgTest}`);

      cy.get('.sidebar-nav').contains('Alunos').click();
      cy.url().should('include', '/admin/alunos');

      cy.contains('a.btn-primary', 'Novo Aluno').click();
      cy.url().should('include', '/cadastro');

      cy.injectAxe();
      cy.checkA11y('.wizard-container', undefined, terminalLog);

      // Passo 1 - Pessoais
      cy.get('input[formControlName="nomeCompleto"]').type('Robô Automatizado Cypress');
      cy.get('input[formControlName="cpf"]').type(currentCpfTest);
      cy.get('input[formControlName="rg"]').type(currentRgTest);
      cy.get('input[formControlName="dataNascimento"]').type('2000-01-01');
      cy.contains('.wizard-footer button', 'Avançar').click();

      // Passo 2 - Endereço
      cy.get('input[formControlName="cep"]').type('01001000');
      cy.get('input[formControlName="rua"]').clear().type('Praça da Sé');
      cy.get('input[formControlName="numero"]').type('123');
      cy.get('input[formControlName="bairro"]').clear().type('Sé');
      cy.get('input[formControlName="cidade"]').clear().type('São Paulo');
      cy.get('input[formControlName="uf"]').clear().type('SP');
      cy.get('input[formControlName="telefoneContato"]').type('11999999999');
      cy.contains('.wizard-footer button', 'Avançar').click();

      // Passo 3 - Deficiência
      cy.get('select[formControlName="tipoDeficiencia"]').select('CEGUEIRA_TOTAL');
      cy.get('select[formControlName="prefAcessibilidade"]').select('BRAILLE');
      cy.contains('.wizard-footer button', 'Avançar').click();

      // Passo 4 - Conclusão
      cy.intercept('POST', '**/beneficiaries').as('createReq');
      cy.contains('.wizard-footer button', 'Salvar Cadastro').should('not.be.disabled').click();

      cy.wait('@createReq').then((interception) => {
         const statusCode = interception.response?.statusCode;
         const body = interception.response?.body;
         if (statusCode !== 201) {
             cy.writeFile('cypress-erro-409-debug.json', {
                 status: statusCode,
                 body: body,
                 requestBody: interception.request.body,
                 cpfTentado: currentCpfTest,
                 rgTentado: currentRgTest
             });
             cy.log(`⚠️ ERRO NA CRIAÇÃO DO ALUNO - DUMP SALVO EM cypress-erro-409-debug.json ⚠️`);
         }
      });

      cy.get('.feedback-banner.sucesso', { timeout: 10000 })
         .should('be.visible')
         .and('contain', 'sucesso');

      cy.log('Limpando sujeira do banco de dados (Teardown)');
      cy.teardownAluno(currentCpfTest).then(() => {
         cy.log(`CPF ${currentCpfTest} apagado do servidor com sucesso.`);
      });
   });
});