import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

type AxeNodeResult = {
  target: Array<string | string[]>;
  failureSummary?: string;
};

bootstrapApplication(App, appConfig)
  .then(() => {
    // Ferramentas de auditoria de acessibilidade ativas apenas em modo de desenvolvimento
    if (isDevMode()) {
      import('axe-core').then((axe) => {

        /** Exibe os detalhes de um nó de violação no console — extraído p/ reduzir nesting */
        const logViolationNode = (node: AxeNodeResult): void => {
          const targetPath = node.target[0];
          const selectorString = Array.isArray(targetPath)
            ? targetPath.join(' ')
            : String(targetPath);

          let domElement: Element | null = null;
          if (typeof document !== 'undefined') {
            try {
              domElement = document.querySelector(selectorString);
            } catch (selectorErr) {
              console.warn(`[A11Y Axe] Seletor inválido ignorado: "${selectorString}"`, selectorErr);
            }
          }

          let angularComponent = 'N/A';
          let curr = domElement;
          while (curr) {
            if (curr.tagName?.toLowerCase().startsWith('app-')) {
              angularComponent = curr.tagName.toLowerCase();
              break;
            }
            curr = curr.parentElement;
          }

          console.log(`   [Componente] <${angularComponent}>`);
          console.log(`   [Problema] ${node.failureSummary}`);
          console.log('   [Elemento HTML afetado]:', domElement ?? selectorString);
          console.log('   --------------------------------------------------');
        };

        /** Executa a auditoria Axe-Core e exibe violações formatadas no console DevTools */
        const rodarAuditoria = (): void => {
          console.log('[A11Y] Rodando auditoria do Axe-Core...');

          axe.default.run().then((results) => {
            if (results.violations.length === 0) {
              console.log('[A11Y] Axe-core: Nenhuma violação nesta tela/modal!');
              return;
            }

            console.log(`[A11Y] ${results.violations.length} REGRA(S) DE ACESSIBILIDADE VIOLADA(S)`);

            results.violations.forEach((violation, index) => {
              console.log(`${index + 1}. ${violation.help} (${violation.id})`);
              console.log(`[Como resolver] ${violation.helpUrl}`);
              violation.nodes.forEach(logViolationNode);
            });
          });
        };

        // Auditoria automática 2s após o boot — aguarda o Angular renderizar a tela inicial
        setTimeout(rodarAuditoria, 2000);

        // Expõe o comando global para uso no DevTools
        Object.defineProperty(globalThis, 'auditarAcessibilidade', {
          value: rodarAuditoria,
          configurable: true,
          writable: false,
        });

        console.log('DICA: Para testar modais, abra o modal e chame auditarAcessibilidade() no console.');
      });
    }
  })
  .catch((err) => console.error('[Bootstrap] Falha ao inicializar a aplicação:', err));
