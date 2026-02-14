import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                amrita: {
                    maroon: '#AF0C3E',
                    yellow: '#FFD92A',
                    bgLight: '#FDF8F9',
                    textDark: '#333333',
                    textGray: '#656565',
                },
            },
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
            },
        },
    },
    plugins: [],
} satisfies Config;
