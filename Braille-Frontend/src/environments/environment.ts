export const environment = {
    production: false,
    apiUrl: '/api', // Proxy local → redireciona para localhost:3000 via proxy.conf.json
    // apiUrl: 'https://braille-api-oieq.onrender.com/api', // Render Online (use no environment.prod.ts)
    sentryDsn: '', // Cole sua Chave Cliente Sentry.io aqui (DSN)
    sentryEnv: 'development'
};

