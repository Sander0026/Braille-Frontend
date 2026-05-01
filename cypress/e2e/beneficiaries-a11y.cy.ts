describe('Beneficiaries A11Y Audit (WCAG 2.1 AA/AAA)', () => {
  beforeEach(() => {
    // Ignorar erros de Uncaught Exception na UI originados por outras libs
    Cypress.on('uncaught:exception', () => false);

    // 1. Realiza o Fluxo de Login
    cy.visit('http://localhost:4200/login');
    cy.get('input[type="text"], input[type="email"]').first().type('admin');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button').contains(/entrar|acessar|login/i).click();
    
    // Aguarda o login processar (Redirecionamento)
    cy.url().should('not.contain', '/login');

    // 2. Acessar o formulário de cadastro
    cy.visit('http://localhost:4200/admin/alunos/cadastro');
    cy.get('form').should('be.visible');
    cy.get('#nomeCompleto').should('be.visible'); // Garante que renderizou o formulário interno
  });

  it('1. Simulação de Navegação por Teclado: Verifique a ordem do foco no fluxo lógico', () => {
    // Foca no primeiro campo do formulário e tabula para verificar a ordem natural
    cy.get('#nomeCompleto').focus().should('have.focus');
    
    cy.realPress('Tab');
    // Deve ir pro upload da foto (o input tem sr-only mas ele é focável)
    cy.focused().should('have.attr', 'id', 'fotoUpload');

    cy.realPress('Tab');
    // Depois termoUpload
    cy.focused().should('have.attr', 'id', 'termoUpload');

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'id', 'cpf');

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'id', 'rg');
  });

  it('2. Validação de Feedback Dinâmico (Falso Travamento e Leitor de Tela)', () => {
    // Mudar de Passo 1 para 4 para simular o "Salvando dados..." no botão Concluir Cadastro
    cy.get('#nomeCompleto').type('Beneficiario Teste Falso Travamento');
    cy.get('#cpf').type('12345678909'); // cpf validador basico ou mock
    cy.get('#dataNascimento').type('1990-01-01');
    cy.contains('Avançar').click();
    
    // Passo 2
    cy.get('#cep').type('29000000');
    cy.get('#rua').type('Logradouro Falso');
    cy.get('#numero').type('123');
    cy.get('#bairro').type('Centro');
    cy.get('#cidade').type('Vitória');
    cy.get('#uf').type('ES');
    cy.get('#telefoneContato').type('27999999999');
    cy.contains('Avançar').click();

    // Passo 3
    cy.get('#tipoDeficiencia').select('CEGUEIRA_TOTAL');
    cy.get('#prefAcessibilidade').select('BRAILLE');
    cy.contains('Avançar').click();

    // Passo 4
    cy.intercept('POST', '**/beneficiarios**', (req) => {
      // Simula uma requisição lenta para dar tempo de verificar o falso travamento
      req.on('response', (res) => {
        res.setDelay(2000);
      });
      req.reply({ statusCode: 201 });
    }).as('postBeneficiario');

    // Ao invés de usar cy.get('.btn-primary'), vamos usar cy.contains('Concluir Cadastro')
    cy.contains('Concluir Cadastro').click();

    // Assert que o botão está ocupado validando 'aria-busy' ou que o container tenha
    cy.get('button[type="submit"]').should('have.attr', 'aria-busy', 'true');
    // Verifica o texto de carregamento que é visível apenas para leitores de tela (.sr-only)
    cy.get('button[type="submit"]').find('.sr-only').should('contain', 'Processando cadastro...');
    
    cy.wait('@postBeneficiario');
  });

  it('3. Validação de Erros: Formulário vazio manda foco para o primeiro campo inválido e aria-describedby', () => {
    // No passo 1, clica em avançar
    cy.contains('Avançar').click();
    
    // ASSERT: Foco deve ser movido para o elemento .ng-invalid ou campo com aria-invalid
    cy.focused().should('have.attr', 'aria-invalid', 'true');

    // ASSERT: As propriedades ARIA descrevendo o erro devem estar configuradas
    cy.focused().invoke('attr', 'aria-describedby').should('exist');
    cy.focused().invoke('attr', 'aria-describedby').then((id) => {
      cy.get(`#${id}`).should('exist').should('have.attr', 'role', 'alert');
    });
  });

  it('4. Teste de Focus Trap e Contexto (Modais e Menus)', () => {
    // Simula a engine de interceptação pra forçar modal de "Aluno Ativo / Inativo"
    cy.intercept('GET', '**/beneficiarios/check**', { 
        statusCode: 200, 
        body: { status: 'inativo', inativoDesde: '2023-01-01', id: 'mock-123', nomeCompleto: 'Fulano da Silva' } 
    }).as('checkDoc');

    // Força abrir modal simulando CPF inativo
    cy.get('#cpf').type('11122233344');
    cy.get('#cpf').blur();
    
    cy.wait('@checkDoc');

    // ASSERT: Modal Trap foi aberto com Role seguro
    cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');

    // TAB: Vai ciclar o focus dentro do modal
    cy.focused().should('have.class', 'btn-reativ-cancelar');
    cy.realPress('Tab');
    cy.focused().should('have.class', 'btn-reativ-confirmar');
    // Se tabular de novo, pode voltar para o começo do modal ou botão fechar, mas cdkTrapFocus cuida do giro.

    // Esc fecha o modal e retorna foco
    cy.focused().realPress('Escape');

    // O elementoFocoAnterior deve ser logicamente o input cpf que disparou o blur
    cy.focused().should('have.attr', 'id', 'cpf');
  });

  it('5. Validação de Botões de Ícone: Lixeira e Editar devem ter aria-label ou .sr-only', () => {
    // Acessar a lista de alunos (onde ficam os botões de ação na tabela)
    cy.visit('http://localhost:4200/admin/alunos');
    cy.get('table').should('be.visible');

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        cy.get('table tbody tr').first().find('button').each(($btn) => {
          // Verifica se o botão tem apenas ícone ou não tem texto visível
          const isIconButton = $btn.find('mat-icon, .material-symbols-rounded, svg').length > 0 && $btn.text().trim() === '';
          
          if (isIconButton) {
            const hasAriaLabel = !!$btn.attr('aria-label');
            const hasSrOnly = $btn.find('.sr-only').length > 0;
            
            // Afirma que o botão de ícone atende aos requisitos de acessibilidade
            expect(hasAriaLabel || hasSrOnly).to.be.true;
          }
        });
      }
    });

  });

});
