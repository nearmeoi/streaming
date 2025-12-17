/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class", // Penting untuk dark mode switch
    theme: {
        extend: {
            fontFamily: {
                display: ["Be Vietnam Pro", "sans-serif"]
            },
            colors: {
                primary: "#0055FF",
                "primary-dark": "#0044CC",
                "background-light": "#ffffff",
                "background-dark": "#020617",
                "surface-light": "#F8FAFC",
                "surface-dark": "#0f172a",
                "text-primary-light": "#000000",
                "text-secondary-light": "#475569",
                "text-secondary-dark": "#94a3b8"
            }
        }
    },
    plugins: []
};
