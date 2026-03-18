import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "var(--primary)",
                "primary-glow": "var(--primary-glow)",
                surface: {
                    primary: "var(--surface-primary)",
                    secondary: "var(--surface-secondary)",
                    hover: "var(--surface-hover)",
                },
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    tertiary: "var(--text-tertiary)",
                },
                border: {
                    primary: "var(--border-primary)",
                    secondary: "var(--border-secondary)",
                },
                card: {
                    bg: "var(--card-bg)",
                    border: "var(--card-border)",
                },
                "sidebar-bg": "var(--sidebar-bg)",
                "topbar-bg": "var(--topbar-bg)",
            },
            fontFamily: {
                sans: ['var(--font-main)'],
                display: ['var(--font-display)'],
            },
            animation: {
                cardAppear: "cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            },
            keyframes: {
                cardAppear: {
                    "0%": {
                        opacity: "0",
                        transform: "translateY(20px)",
                    },
                    "100%": {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
            },
        },
    },
    plugins: [],
};
export default config;
