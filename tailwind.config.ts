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
                "primary-dark": "var(--primary-dark)",
                "primary-light": "var(--primary-light)",
                "primary-glow": "var(--primary-glow)",
                gold: "var(--gold)",
                "gold-dim": "var(--gold-dim)",
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
                    accent: "var(--border-accent)",
                },
                card: {
                    bg: "var(--card-bg)",
                    border: "var(--card-border)",
                },
                "sidebar-bg": "var(--sidebar-bg)",
                "topbar-bg": "var(--topbar-bg)",
                error: "var(--error)",
                success: "var(--success)",
            },
            fontFamily: {
                sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Playfair Display', 'Georgia', 'serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                cardAppear: "cardAppear 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                fadeInUp: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                slideInRight: "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                shimmer: "shimmer 2s linear infinite",
                pulseGold: "pulseGold 2.5s ease-in-out infinite",
            },
            keyframes: {
                cardAppear: {
                    "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)", filter: "blur(4px)" },
                    "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideInRight: {
                    "0%": { opacity: "0", transform: "translateX(20px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% center" },
                    "100%": { backgroundPosition: "200% center" },
                },
                pulseGold: {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(200, 169, 110, 0)" },
                    "50%": { boxShadow: "0 0 0 5px rgba(200, 169, 110, 0.08)" },
                },
            },
            boxShadow: {
                'gold-sm': '0 4px 12px rgba(200,169,110,0.2)',
                'gold': '0 8px 24px -4px rgba(200,169,110,0.35)',
                'gold-lg': '0 16px 40px -8px rgba(200,169,110,0.4)',
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
                '3xl': '20px',
                '4xl': '24px',
            },
        },
    },
    plugins: [],
};
export default config;
