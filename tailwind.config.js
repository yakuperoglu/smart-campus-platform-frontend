/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#f5f5f5', // Light Gray
                surface: '#ffffff', // White
                primary: '#262626', // Dark Gray (Text)
                secondary: '#595959', // Medium Gray (Text)
                accent: '#000000', // Black/Clean Dark for accents
                border: '#e0e0e0', // Light border
            },
            borderRadius: {
                'card': '12px',
                'btn': '8px',
            },
        },
    },
    plugins: [],
}
