/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Palette du club, calquée sur la structure de tokens de l'AS Roma :
         * une couleur d'institution qui porte l'en-tête et le pied de page, un
         * accent qui souligne les titres et les états actifs, et une famille de
         * gris sombres pour les fonds éditoriaux.
         */
        club: {
          green: '#0D7C27',
          'green-dark': '#0A5E1F',
          'green-deep': '#084A18',
          yellow: '#F9ED3A',
          'yellow-dark': '#E6D532',
        },
        graphite: '#18191c',
        'graphite-light': '#202126',
        charcoal: '#111111',
      },
      fontFamily: {
        sans: ['Archivo', 'Arial', 'Helvetica', 'sans-serif'],
        display: ['Archivo', 'Arial', 'Helvetica', 'sans-serif'],
      },
      maxWidth: {
        site: '1440px',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        // Bandeau défilant : le contenu est doublé, glisser de moitié boucle sans saut.
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        'fade-in': 'fade-in .6s ease-out both',
        ticker: 'ticker 40s linear infinite',
      },
    },
  },
  plugins: [],
};
