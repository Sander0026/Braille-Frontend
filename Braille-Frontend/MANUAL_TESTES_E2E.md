# Manual do Robô de Testes Automatizados (Cypress E2E)

Este guia prático ensina como rodar os testes invisíveis e visíveis do Braille-frontend usando a arquitetura de múltiplos perfis (RBAC).

## Pré-requisitos Básicos
- O Backend NestJS (banco de dados, API) deve estar **obrigatoriamente ligado** (localhost:3000).
- O Frontend Angular deve estar **obrigatoriamente servindo o código** no Terminal 1 (`npm start` rodando no localhost:4200).
- Use um Terminal 2 separado para rodar os comandos do robô abaixo.

---

## MODO 1: O "Robô Fantasma" (Headless)
O modo Headless é excelente para rotinas diárias. O robô simula um navegador nos bastidores sem abrir janelas no seu monitor. O relatório final será desenhado no terminal (verde = Passou, vermelho = Falhou).

Você pode escolher com qual perfil o robô vai tentar realizar os fluxos de Login e Cadastro de Aluno, disparando um dos seguintes itens:

*   **Perfil Administrador Global:**
    `npm run teste_automatizado:adm`

*   **Perfil Secretaria:**
    `npm run teste_automatizado:secretaria`

*   **Perfil Professores:**
    *(Professor falhará propositalmente no teste de criar alunos pois não possui permissão de leitura nesse módulo).*
    `npm run teste_automatizado:professor`

*   **Perfil Comunicação:**
    `npm run teste_automatizado:comunicacao`

---

## MODO 2: O "Navegador Assistido" (GUI Mode)
O modo Visual (GUI) é fundamental se você quiser exibir o sistema para a escola, gravar vídeos ou debugar as velocidades exatas dos cliques na Interface.

*   Abra a central interativa do robô:
    `npm run teste_automatizado:gui`

Quando a janela gráfica carregar (geralmente azul):
1.  Clique em **"E2E Testing"**.
2.  Escolha o seu Navegador favorito Chrome ou Edge (já instalados na sua máquina) e clique em "**Start E2E Testing**".
3.  Uma tela que mapeia todos os testes atuais se abrirá.
4.  No canto central esquerdo surgirão dois arquivos na lista: **`fluxo-alunos.cy.ts`** e **`fluxo-login.cy.ts`**.
5.  Clique sobre o nome do arquivo que deseja assistir.
6.  Tire as mãos do teclado/mouse e assista a "Mágica" preenchendo o sistema freneticamente! 🚀

---

## Como o Banco de Dados se Comporta?

Implementamos a arquitetura do **Teardown Invisível** recomendada no mercado Sênior de Qualidade:
1. O Robô vai logar como "admin" na sua tela.
2. Vai criar um Aluno com o nome "Robô Automatizado Cypress" e inventar um CPF válido gerado na hora.
3. Se a caixa verde de SUCESSO subornar, o teste passará com êxito!
4. IMEDIATAMENTE antes da tela fechar, o robô injeta seu Token JWT no backend, e lança uma API `DELETE` invisível apagando fisicamente do banco de dados o CPF fantasma.

> **Tradução:** Você não precisará ficar indo no banco apagar CPFs "Lixo". Sua tabela permanecerá limpa!
