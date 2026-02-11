/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // Cores de Alto Contraste (seguras para dalmônicos)
      colors: {
        primary: {
          DEFAULT: '#0052CC', // Azul forte (Link/Ação)
          dark: '#0747A6',
          light: '#DEEBFF',
        },
        focus: '#FFAB00', // Amarelo Ouro (Foco do teclado)
        high: {
          black: '#172B4D', // Texto principal (quase preto, mas azulado)
          gray: '#5E6C84',  // Texto secundário acessível
        }
      },
      // Espaçamentos maiores para quem tem dificuldade motora
      spacing: {
        '18': '4.5rem',
      }
    },
  },
  plugins: [],
}