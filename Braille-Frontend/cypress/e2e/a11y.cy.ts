describe('Acessibilidade (A11Y) - Fluxos Principais', () => {

    function terminalLog(violations: any[]) {
        cy.task(
            'log',
            `${violations.length} problemas de acessibilidade encontrados na tela atual.`
        );

        const violationData = violations.map(
            ({ id, impact, description, nodes }: any) => ({
                id,
                impact,
                description,
                nodes: nodes.length
            })
        );

        cy.task('table', violationData);
    }

    it('Garante que a página de Login passa nos testes do Axe', () => {
        cy.visit('/login');
        
        // Aguarda a renderização completa do componente Angular (lazy loading)
        // O `cy.get` embute retentativas por até 4 segundos por padrão.
        cy.get('h1').contains('Sistema Administrativo').should('be.visible');
        cy.get('main.login-wrapper').should('be.visible');

        cy.injectAxe();
        // Testa e mostra as violações no console do cypress open (ou erro no terminal se CI/CD)
        cy.checkA11y(null, null, terminalLog);
    });

});
