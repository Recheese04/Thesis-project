/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#091832", // Match web dark navy
        accent: "#f9a825", // Gold
        "blue-600": "#2563eb",
        "slate-50": "#f8fafc",
        "slate-200": "#e2e8f0",
        "slate-400": "#94a3b8",
        "slate-500": "#64748b",
        "slate-600": "#475569",
        "slate-900": "#0f172a",
        "emerald-400": "#34d399",
        "blue-500": "#3b82f6",
        "blue-100": "#dbeafe",
      },
      fontFamily: {
        display: ["System"], // We'll stick to system for now but themed
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        "xl": "12px",
      },
    },
  },
  plugins: [],
};
