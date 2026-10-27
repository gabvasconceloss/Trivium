export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F6FA", // Fundo principal claro
        surface: "#FFFFFF", // Cards modo claro
        ink: "#181B2E", // Texto principal
        "ink-soft": "#6B7280", // Texto secundário
        primary: { DEFAULT: "#3B5FE0", dark: "#2C48B8", light: "#EAF0FD" },
        accent: { DEFAULT: "#22B8A0", dark: "#189D89", light: "#E2F7F2" },
        ai: { DEFAULT: "#8B5CF6", dark: "#7C3AED", light: "#F1EAFE" },
        streak: { DEFAULT: "#F5A623", light: "#FDECC8" },
        danger: "#E8564C",
        border: "#E7E8F0", // Bordas modo claro
        // Novas variáveis semânticas para o Dark Mode facilitarem a manutenção:
        dark: {
          canvas: "#0F1222",
          surface: "#1B1E36",
          border: "rgba(255,255,255,0.1)",
          text: "#EDEFF7",
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
      boxShadow: {
        card: "0 1px 2px rgba(24,27,46,.04), 0 6px 18px -8px rgba(24,27,46,.12)",
      },
      backgroundImage: {
        "banner-gradient": "linear-gradient(120deg, #2E4FDB 0%, #22B8A0 130%)",
      },
    },
  },
  plugins: [],
};
