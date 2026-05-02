import type { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: '/api', // Proxy local → redireciona para localhost:3000 via proxy.conf.json
};
