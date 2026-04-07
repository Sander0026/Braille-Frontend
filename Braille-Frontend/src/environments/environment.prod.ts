import type { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://braille-api-oieq.onrender.com/api',
  sentryDsn: '', // OBRIGATÓRIO — substitua pelo DSN do Sentry antes de cada deploy de produção
  sentryEnv: 'production',
};
