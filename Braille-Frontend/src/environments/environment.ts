/**
 * Contrato de tipagem para os objetos de configuração de ambiente.
 * Exportado para uso em services e testes — garante que DEV e PROD
 * tenham exatamente a mesma forma (erro de compilação se faltar campo).
 */
export interface Environment {
  /** Indica se o build é de produção (tree-shaking agressivo, sem devtools) */
  production: boolean;
  /** URL base da API REST. Em DEV: proxy local via proxy.conf.json */
  apiUrl: string;
  /**
   * DSN do cliente Sentry.io para rastreamento de erros.
   * ⚠️ OBRIGATÓRIO em produção — substitua antes do deploy.
   * Deixe vazio ('') para desabilitar o Sentry neste ambiente.
   */
  sentryDsn: string;
  /** Nome do ambiente reportado ao Sentry (ex: 'development', 'production') */
  sentryEnv: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: '/api', // Proxy local → redireciona para localhost:3000 via proxy.conf.json
  sentryDsn: '', // ⚠️ Deixe vazio em DEV — nunca use o DSN de produção aqui
  sentryEnv: 'development',
};
