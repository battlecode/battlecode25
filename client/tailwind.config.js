const colors = require('tailwindcss/colors')

module.exports = {
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        fontFamily: {
            sans: ['Martian Mono', 'sans-serif']
        },
        fontSize: {
            xxxs: '.4rem',
            xxs: '.6rem',
            xs: '.75rem',
            sm: '.875rem',
            tiny: '.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '4rem',
            '7xl': '5rem'
        },
        extend: {
            transitionProperty: {
                'max-height': 'max-height'
            },
            boxShadow: {
                centered: '0 0 10px 1px rgba(0,0,0,0.6)'
            },
            colors: {
                red: '#ff9194',
                pink: '#ffb4c1',
                green: '#00a28e',
                cyan: '#02a7b9',
                cyanDark: '#1899a7',
                blue: '#04a2d9',
                blueLight: '#26abd9',
                blueDark: '#00679e',

                dark: colors.gray['800'],
                darkHighlight: colors.gray['900'],
                black: colors.black,
                light: '#aaaaaa22',
                lightHighlight: '#ffffff33',
                medHighlight: '#d0d0d066',
                lightCard: '#f7f7f722',

                team0: '#cdcdcc',
                team1: '#fee493'
            }
        }
    },
    plugins: []
}
