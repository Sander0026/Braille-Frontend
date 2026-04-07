import type { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: '/api', // Proxy local → redireciona para localhost:3000 via proxy.conf.json
  sentryDsn: '', // Deixe vazio em DEV — nunca use o DSN de produção aqui
  sentryEnv: 'development',
};
