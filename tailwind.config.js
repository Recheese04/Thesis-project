/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./bisu-api/resources/views/**/*.blade.php", // Add this!
  
  ],
  theme: {
    extend: {
      // These extensions help with the "Scannability" you requested
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563eb", // BISU Blue style
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
}